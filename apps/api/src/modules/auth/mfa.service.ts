import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  generateSecret,
  generateURI,
  verify as otpVerify,
  NobleCryptoPlugin,
  ScureBase32Plugin,
} from 'otplib';
import * as QRCode from 'qrcode';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { encryptTotpSecret, decryptTotpSecret } from './mfa-crypto';
import { UserService } from '../user/user.service';
import { NotificationsService } from '../notifications/notifications.service';

const TOTP_ISSUER = 'MoPD CMS';
const BACKUP_CODE_COUNT = 10;
const TOTP_WINDOW = (() => {
  const raw = process.env.MFA_TOTP_WINDOW;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) ? 1 : parsed;
})();
const EMAIL_OTP_TTL_MS = (() => {
  const raw = process.env.MFA_EMAIL_OTP_TTL_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) ? 5 * 60 * 1000 : parsed;
})();
const EMAIL_OTP_MAX_ATTEMPTS = 5;

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

export interface MfaEnrollmentResult {
  qrCodeDataUrl: string;
  secret: string;
  backupCodes: string[];
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly pendingSecrets = new Map<string, string>();
  private readonly pendingBackupCodes = new Map<string, string[]>();
  private readonly backupCodeStore = new Map<string, string[]>();

  private readonly emailOtpStore = new Map<
    string,
    { code: string; expiresAt: number; attempts: number }
  >();

  constructor(
    private readonly userService: UserService,
    private readonly notificationsService: NotificationsService,
  ) {}

  isGloballyRequired(): boolean {
    return (
      Boolean(process.env.AUTH_MFA_REQUIRED) &&
      process.env.AUTH_MFA_REQUIRED === 'true'
    );
  }

  isRequiredForRole(roles: string[]): { required: boolean; totpOnly: boolean } {
    const elevated = ['SuperAdmin', 'SystemAdmin'];
    const hasElevated = roles.some((r) => elevated.includes(r));
    if (hasElevated) {
      return { required: true, totpOnly: true };
    }
    return {
      required: this.isGloballyRequired(),
      totpOnly: false,
    };
  }

  async generateEnrollment(
    userId: string,
    email: string,
  ): Promise<MfaEnrollmentResult> {
    const secret = generateSecret({ crypto, base32 });
    const otpauth = generateURI({
      secret,
      issuer: TOTP_ISSUER,
      label: email,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    const backupCodes = this.generateBackupCodePlaintexts();

    this.pendingSecrets.set(userId, secret);
    this.pendingBackupCodes.set(userId, backupCodes);

    return { qrCodeDataUrl, secret, backupCodes };
  }

  async confirmEnrollment(userId: string, code: string): Promise<boolean> {
    const secret = this.pendingSecrets.get(userId);
    if (!secret) {
      return false;
    }

    const result = await otpVerify({
      secret,
      token: code,
      crypto,
      base32,
      epochTolerance: TOTP_WINDOW * 30,
    });
    if (!result.valid) {
      return false;
    }

    const encrypted = encryptTotpSecret(secret);
    const backupCodes = this.pendingBackupCodes.get(userId) ?? [];
    const hashedCodes = await this.hashBackupCodes(backupCodes);

    await this.userService.setMfaEnrollment(userId, {
      mfaEnabled: true,
      mfaMethod: 'totp',
      totpSecret: encrypted,
      totpVerifiedAt: new Date(),
    });

    this.storeBackupCodes(userId, hashedCodes);
    this.pendingSecrets.delete(userId);
    this.pendingBackupCodes.delete(userId);
    return true;
  }

  async verifyTotp(userId: string, code: string): Promise<boolean> {
    const user = await this.userService.findActiveById(userId);
    if (!user?.totpSecret) {
      return false;
    }

    try {
      const secret = decryptTotpSecret(user.totpSecret);
      const result = await otpVerify({
        secret,
        token: code,
        crypto,
        base32,
        epochTolerance: TOTP_WINDOW * 30,
      });
      return result.valid;
    } catch (err) {
      this.logger.error(
        `Failed to decrypt TOTP secret for user ${userId}`,
        err,
      );
      return false;
    }
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const storedCodes = this.backupCodeStore.get(userId);
    if (!storedCodes || storedCodes.length === 0) {
      return false;
    }

    for (let i = 0; i < storedCodes.length; i++) {
      const match = await bcrypt.compare(code, storedCodes[i]);
      if (match) {
        storedCodes.splice(i, 1);
        this.backupCodeStore.set(userId, storedCodes);
        return true;
      }
    }
    return false;
  }

  async sendEmailOtp(userId: string, email: string): Promise<void> {
    const code = randomBytes(3)
      .readUIntBE(0, 3)
      .toString()
      .padStart(6, '0')
      .slice(-6);

    this.emailOtpStore.set(userId, {
      code,
      expiresAt: Date.now() + EMAIL_OTP_TTL_MS,
      attempts: 0,
    });

    await this.notificationsService.queueEmail('mfa_login_otp', email, {
      locale: 'en',
      variables: {
        code,
        expiresInMinutes: Math.round(EMAIL_OTP_TTL_MS / 60000),
      },
    });
  }

  verifyEmailOtp(userId: string, code: string): boolean {
    const entry = this.emailOtpStore.get(userId);
    if (!entry) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      this.emailOtpStore.delete(userId);
      return false;
    }
    entry.attempts += 1;
    if (entry.attempts > EMAIL_OTP_MAX_ATTEMPTS) {
      this.emailOtpStore.delete(userId);
      return false;
    }
    if (entry.code !== code) {
      return false;
    }
    this.emailOtpStore.delete(userId);
    return true;
  }

  async updateMfaMethod(
    userId: string,
    method: 'totp' | 'email',
  ): Promise<void> {
    await this.userService.setMfaEnrollment(userId, {
      mfaEnabled: true,
      mfaMethod: method,
      totpSecret: null,
      totpVerifiedAt: null,
    });
  }

  async disableMfa(userId: string): Promise<void> {
    await this.userService.clearMfaEnrollment(userId);
    this.backupCodeStore.delete(userId);
  }

  getBackupCodeRemainingCount(userId: string): number {
    return this.backupCodeStore.get(userId)?.length ?? 0;
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.userService.findActiveById(userId);
    if (!user?.mfaEnabled) {
      throw new UnprocessableEntityException('MFA is not enrolled');
    }

    const backupCodes = this.generateBackupCodePlaintexts();
    const hashedCodes = await this.hashBackupCodes(backupCodes);
    this.storeBackupCodes(userId, hashedCodes);
    return backupCodes;
  }

  private generateBackupCodePlaintexts(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
  }

  private storeBackupCodes(userId: string, hashedCodes: string[]): void {
    this.backupCodeStore.set(userId, hashedCodes);
  }
}
