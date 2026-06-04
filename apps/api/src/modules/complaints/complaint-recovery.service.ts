import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ComplaintLocale } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';
import Redis from 'ioredis';
import { normalizeComplainantEmail } from '../../common/utils/contact-normalization';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecoveryChannel,
  type RecoveryRequestDto,
  type RecoveryVerifyDto,
} from './dto/recovery-request.dto';

const OTP_TTL_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REFERENCES = 10;
const CONTACT_REQUEST_LIMIT = 3;
const CONTACT_REQUEST_WINDOW_MS = 60 * 60 * 1000;

interface StoredOtp {
  codeHash: string;
  channel: RecoveryChannel;
  attempts: number;
}

function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REDIS_URL must be configured in production');
  }
  return 'redis://localhost:6379';
}

function isRecoverySmsEnabled(): boolean {
  return process.env.RECOVERY_SMS_ENABLED === 'true';
}

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function hashContactKey(contactKey: string): string {
  return createHash('sha256').update(contactKey).digest('hex');
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function tooManyRequests(message: string): HttpException {
  return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
}

@Injectable()
export class ComplaintRecoveryService {
  private readonly logger = new Logger(ComplaintRecoveryService.name);
  private readonly useInMemoryStore =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  private readonly otpStore = new Map<string, StoredOtp>();
  private readonly lockStore = new Map<string, number>();
  private readonly requestCountStore = new Map<string, number[]>();
  private readonly redis: Redis | null = this.useInMemoryStore
    ? null
    : new Redis(getRedisUrl(), {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async requestRecovery(
    body: RecoveryRequestDto,
    correlationId?: string,
  ): Promise<void> {
    const contactKey = this.resolveContactKey(body);
    await this.ensureNotLocked(contactKey);
    await this.enforceContactRequestLimit(contactKey);

    const complaints = await this.findComplaintsForContact(body);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_RECOVERY_REQUESTED,
      correlationId,
      metadata: {
        channel: body.channel,
        contactHash: hashContactKey(contactKey),
        matchCount: complaints.length,
      },
    });

    if (complaints.length === 0) {
      return;
    }

    if (body.channel === RecoveryChannel.SMS && !isRecoverySmsEnabled()) {
      this.logger.warn(
        'Recovery SMS requested but RECOVERY_SMS_ENABLED is not true',
      );
      return;
    }

    const code = generateOtpCode();
    await this.persistOtp(contactKey, {
      codeHash: hashOtp(code),
      channel: body.channel,
      attempts: 0,
    });

    if (body.channel === RecoveryChannel.EMAIL && body.email) {
      try {
        await this.notificationsService.queueComplaintRecoveryOtp(
          normalizeComplainantEmail(body.email),
          code,
          body.locale as ComplaintLocale,
          correlationId,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to queue recovery OTP email: ${message}`);
      }
    }
  }

  async verifyRecovery(
    body: RecoveryVerifyDto,
    correlationId?: string,
  ): Promise<{ references: { referenceNo: string; submittedAt: string }[] }> {
    const contactKey = this.resolveContactKey(body);
    await this.ensureNotLocked(contactKey);

    const stored = await this.getOtp(contactKey);
    if (!stored) {
      await this.recordFailedVerify(contactKey, correlationId, 'no_otp');
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (hashOtp(body.code) !== stored.codeHash) {
      stored.attempts += 1;
      if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
        await this.clearOtp(contactKey);
        await this.setLockout(contactKey);
        await this.recordFailedVerify(contactKey, correlationId, 'max_attempts');
        throw tooManyRequests(
          'Too many invalid attempts. Try again later.',
        );
      }
      await this.persistOtp(contactKey, stored);
      await this.recordFailedVerify(contactKey, correlationId, 'invalid_code');
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.clearOtp(contactKey);
    const complaints = await this.findComplaintsForContact(body);
    const references = complaints.slice(0, MAX_REFERENCES).map((c) => ({
      referenceNo: c.referenceNo,
      submittedAt: c.submittedAt.toISOString(),
    }));

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_RECOVERY_VERIFIED,
      correlationId,
      metadata: {
        channel: body.channel,
        contactHash: hashContactKey(contactKey),
        referenceCount: references.length,
      },
    });

    return { references };
  }

  private resolveContactKey(body: RecoveryRequestDto): string {
    if (body.channel === RecoveryChannel.EMAIL) {
      if (!body.email?.trim()) {
        throw new BadRequestException('email is required for email channel');
      }
      return `email:${normalizeComplainantEmail(body.email)}`;
    }
    if (!body.phone?.trim()) {
      throw new BadRequestException('phone is required for sms channel');
    }
    return `sms:${body.phone.trim()}`;
  }

  private async findComplaintsForContact(body: RecoveryRequestDto) {
    if (body.channel === RecoveryChannel.EMAIL && body.email) {
      return this.prisma.complaint.findMany({
        where: {
          complainantEmail: normalizeComplainantEmail(body.email),
        },
        orderBy: { submittedAt: 'desc' },
        take: MAX_REFERENCES,
        select: { referenceNo: true, submittedAt: true },
      });
    }
    if (body.channel === RecoveryChannel.SMS && body.phone) {
      return this.prisma.complaint.findMany({
        where: { complainantPhone: body.phone.trim() },
        orderBy: { submittedAt: 'desc' },
        take: MAX_REFERENCES,
        select: { referenceNo: true, submittedAt: true },
      });
    }
    return [];
  }

  private otpKey(contactKey: string): string {
    return `recovery:otp:${hashContactKey(contactKey)}`;
  }

  private lockKey(contactKey: string): string {
    return `recovery:lock:${hashContactKey(contactKey)}`;
  }

  private requestLimitKey(contactKey: string): string {
    return `recovery:req:${hashContactKey(contactKey)}`;
  }

  private async persistOtp(
    contactKey: string,
    value: StoredOtp,
  ): Promise<void> {
    const key = this.otpKey(contactKey);
    const payload = JSON.stringify(value);
    if (this.useInMemoryStore) {
      this.otpStore.set(key, value);
      return;
    }
    if (!this.redis) {
      throw new BadRequestException('Recovery store is unavailable');
    }
    await this.redis.psetex(key, OTP_TTL_MS, payload);
  }

  private async getOtp(contactKey: string): Promise<StoredOtp | null> {
    const key = this.otpKey(contactKey);
    if (this.useInMemoryStore) {
      return this.otpStore.get(key) ?? null;
    }
    if (!this.redis) {
      return null;
    }
    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredOtp;
  }

  private async clearOtp(contactKey: string): Promise<void> {
    const key = this.otpKey(contactKey);
    if (this.useInMemoryStore) {
      this.otpStore.delete(key);
      return;
    }
    if (this.redis) {
      await this.redis.del(key);
    }
  }

  private async ensureNotLocked(contactKey: string): Promise<void> {
    const key = this.lockKey(contactKey);
    if (this.useInMemoryStore) {
      const until = this.lockStore.get(key);
      if (until !== undefined && until > Date.now()) {
        throw tooManyRequests('Too many attempts. Try again later.');
      }
      return;
    }
    if (!this.redis) {
      return;
    }
    const locked = await this.redis.get(key);
    if (locked === '1') {
      throw tooManyRequests('Too many attempts. Try again later.');
    }
  }

  private async setLockout(contactKey: string): Promise<void> {
    const key = this.lockKey(contactKey);
    if (this.useInMemoryStore) {
      this.lockStore.set(key, Date.now() + LOCKOUT_MS);
      return;
    }
    if (this.redis) {
      await this.redis.psetex(key, LOCKOUT_MS, '1');
    }
  }

  private async enforceContactRequestLimit(
    contactKey: string,
  ): Promise<void> {
    const key = this.requestLimitKey(contactKey);
    const now = Date.now();
    if (this.useInMemoryStore) {
      const times = (this.requestCountStore.get(key) ?? []).filter(
        (t) => now - t < CONTACT_REQUEST_WINDOW_MS,
      );
      if (times.length >= CONTACT_REQUEST_LIMIT) {
        throw tooManyRequests(
          'Too many recovery requests for this contact. Try again later.',
        );
      }
      times.push(now);
      this.requestCountStore.set(key, times);
      return;
    }
    if (!this.redis) {
      return;
    }
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.pexpire(key, CONTACT_REQUEST_WINDOW_MS);
    }
    if (count > CONTACT_REQUEST_LIMIT) {
      throw tooManyRequests(
        'Too many recovery requests for this contact. Try again later.',
      );
    }
  }

  private async recordFailedVerify(
    contactKey: string,
    correlationId: string | undefined,
    reason: string,
  ): Promise<void> {
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_RECOVERY_FAILED,
      correlationId,
      metadata: {
        contactHash: hashContactKey(contactKey),
        reason,
      },
    });
  }
}
