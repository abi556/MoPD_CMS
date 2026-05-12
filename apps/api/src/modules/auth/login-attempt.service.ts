import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
import { createHash } from 'crypto';
import Redis from 'ioredis';

function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REDIS_URL must be configured in production');
  }
  return 'redis://localhost:6379';
}

function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailKey(email: string): string {
  const norm = normalizedEmail(email);
  return createHash('sha256').update(norm).digest('hex');
}

function getLockoutMaxAttempts(): number {
  const raw = process.env.AUTH_LOCKOUT_MAX_ATTEMPTS;
  if (!raw) {
    return 5;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 20) {
    return 5;
  }
  return n;
}

function getLockoutDurationMs(): number {
  const raw = process.env.AUTH_LOCKOUT_DURATION_MS;
  if (!raw) {
    return 15 * 60 * 1000;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 60_000) {
    return 15 * 60 * 1000;
  }
  return n;
}

function getAttemptWindowMs(): number {
  const raw = process.env.AUTH_LOCKOUT_ATTEMPT_WINDOW_MS;
  if (!raw) {
    return 15 * 60 * 1000;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 60_000) {
    return 15 * 60 * 1000;
  }
  return n;
}

@Injectable()
export class LoginAttemptService {
  private readonly useInMemoryStore =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

  private readonly failCounts = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly lockedUntil = new Map<string, number>();

  private readonly redis = this.useInMemoryStore
    ? null
    : new Redis(getRedisUrl(), {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

  private readonly maxAttempts = getLockoutMaxAttempts();
  private readonly lockMs = getLockoutDurationMs();
  private readonly attemptWindowMs = getAttemptWindowMs();

  normalizeEmail(email: string): string {
    return normalizedEmail(email);
  }

  async ensureEmailNotLockedAsync(email: string): Promise<void> {
    const h = emailKey(email);
    if (this.useInMemoryStore) {
      const until = this.lockedUntil.get(h);
      if (until !== undefined && until > Date.now()) {
        throw new TooManyRequestsException(
          'Too many login attempts; try again later.',
        );
      }
      return;
    }
    if (!this.redis) {
      return;
    }
    const locked = await this.redis.get(`auth:login:lock:${h}`);
    if (locked === '1') {
      throw new TooManyRequestsException(
        'Too many login attempts; try again later.',
      );
    }
  }

  async recordFailedAttempt(email: string): Promise<boolean> {
    const h = emailKey(email);
    const now = Date.now();

    if (this.useInMemoryStore) {
      const fail = this.failCounts.get(h);
      if (!fail || fail.resetAt <= now) {
        this.failCounts.set(h, {
          count: 1,
          resetAt: now + this.attemptWindowMs,
        });
      } else {
        fail.count += 1;
      }
      const current = this.failCounts.get(h)!;
      if (current.count >= this.maxAttempts) {
        this.lockedUntil.set(h, now + this.lockMs);
        this.failCounts.delete(h);
        return true;
      }
      return false;
    }

    if (!this.redis) {
      return false;
    }
    const count = await this.redis.incr(`auth:login:fails:${h}`);
    if (count === 1) {
      await this.redis.pexpire(`auth:login:fails:${h}`, this.attemptWindowMs);
    }
    if (count >= this.maxAttempts) {
      await this.redis.del(`auth:login:fails:${h}`);
      await this.redis.psetex(`auth:login:lock:${h}`, this.lockMs, '1');
      return true;
    }
    return false;
  }

  async clearFailures(email: string): Promise<void> {
    const h = emailKey(email);
    if (this.useInMemoryStore) {
      this.failCounts.delete(h);
      this.lockedUntil.delete(h);
      return;
    }
    if (!this.redis) {
      return;
    }
    await this.redis.del(`auth:login:fails:${h}`);
    await this.redis.del(`auth:login:lock:${h}`);
  }
}
