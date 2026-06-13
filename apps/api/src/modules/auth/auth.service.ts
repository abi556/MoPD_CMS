import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { UserService } from '../user/user.service';
import { JwtPayload, JwtUser } from './interfaces/jwt-user.interface';
import { LoginAttemptService } from './login-attempt.service';
import { MfaService } from './mfa.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../../common/validators/password-policy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthLoginResult extends TokenPair {
  user: JwtUser;
  mustChangePassword: boolean;
  mfaRequired: boolean;
}

interface IssuedTokens extends TokenPair {
  refreshToken: string;
}

export interface PublicTokenPair {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function comparePassword(
  password: string,
  expectedHashHex: string,
  salt: string,
): boolean {
  const computedHash = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedHash = Buffer.from(expectedHashHex, 'hex');

  return timingSafeEqual(computedHash, expectedHash);
}

function isBcryptHash(hash: string): boolean {
  return (
    hash.startsWith('$2a$') ||
    hash.startsWith('$2b$') ||
    hash.startsWith('$2y$')
  );
}

function getBcryptCostFactor(): number {
  const raw = process.env.AUTH_BCRYPT_COST;
  if (!raw) {
    return 12;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 10 || parsed > 15) {
    return 12;
  }
  return parsed;
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

function getPasswordResetTokenTtlMs(): number {
  const raw = process.env.AUTH_PASSWORD_RESET_TOKEN_TTL_MS;
  if (!raw) {
    return 60 * 60 * 1000;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 300_000) {
    return 60 * 60 * 1000;
  }
  return parsed;
}

function getRefreshTtlMs(): number {
  const raw = process.env.AUTH_REFRESH_TTL_MS;
  if (!raw) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  return parsed;
}

interface RefreshSession {
  userId: string;
  passwordVersion: number;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenTtlSeconds = 900;
  private readonly refreshTokenTtlMs = getRefreshTtlMs();
  private readonly passwordResetTokenTtlMs = getPasswordResetTokenTtlMs();
  private readonly useInMemoryStore =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  private readonly refreshTokenStore = new Map<string, string>();
  private readonly passwordResetStore = new Map<string, string>();
  private readonly revokedAccessStore = new Map<string, number>();
  private readonly redis = this.useInMemoryStore
    ? null
    : new Redis(getRedisUrl(), {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly auditService: AuditService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly mfaService: MfaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.userService.ensureSeedUsers();
  }

  async login(email: string, password: string): Promise<AuthLoginResult> {
    const bundle = await this.issueLoginTokens(email, password, undefined);
    return {
      accessToken: bundle.tokenPair.accessToken,
      refreshToken: bundle.refreshToken,
      tokenType: bundle.tokenPair.tokenType,
      expiresIn: bundle.tokenPair.expiresIn,
      user: bundle.user,
      mustChangePassword: bundle.mustChangePassword,
      mfaRequired: bundle.mfaRequired,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const session = await this.getRefreshSession(refreshToken);
    if (!session) {
      await this.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findActiveById(session.userId);
    if (!user || user.passwordVersion !== session.passwordVersion) {
      await this.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.deleteRefreshToken(refreshToken);
    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    return this.issueTokenPair(authUser, user.passwordVersion);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const session = await this.getRefreshSession(refreshToken);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userService.findActiveById(userId);
    if (!user || user.passwordVersion !== session.passwordVersion) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.deleteRefreshToken(refreshToken);
  }

  async logoutByRefreshToken(refreshToken: string): Promise<void> {
    const session = await this.getRefreshSession(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.deleteRefreshToken(refreshToken);
  }

  async logoutSession(
    userId: string,
    refreshToken: string,
    accessJti: string,
    accessExp?: number,
    correlationId?: string,
  ): Promise<void> {
    const session = await this.getRefreshSession(refreshToken);
    if (!session || session.userId !== userId) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGOUT_FAILED,
        actorUserId: userId,
        correlationId,
        metadata: { reason: 'refresh_token_invalid' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userService.findActiveById(userId);
    if (!user || user.passwordVersion !== session.passwordVersion) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGOUT_FAILED,
        actorUserId: userId,
        correlationId,
        metadata: { reason: 'refresh_session_stale' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.deleteRefreshToken(refreshToken);
    await this.revokeAccessToken(accessJti, accessExp);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_LOGOUT_SUCCEEDED,
      actorUserId: userId,
      correlationId,
      metadata: { accessJti },
    });
  }

  async isAccessTokenRevoked(jti: string): Promise<boolean> {
    const key = this.accessRevokeKey(jti);
    if (this.useInMemoryStore) {
      const expiresAt = this.revokedAccessStore.get(key);
      if (!expiresAt) {
        return false;
      }
      if (expiresAt <= Date.now()) {
        this.revokedAccessStore.delete(key);
        return false;
      }
      return true;
    }
    if (!this.redis) {
      return false;
    }
    const value = await this.redis.get(key);
    return value === '1';
  }

  private refreshSessionStorageValue(session: RefreshSession): string {
    return `${session.userId}|${session.passwordVersion}`;
  }

  private parseRefreshStorageValue(raw: string | null): RefreshSession | null {
    if (!raw) {
      return null;
    }
    const pipe = raw.indexOf('|');
    if (pipe <= 0) {
      return null;
    }
    const userId = raw.slice(0, pipe);
    const pv = Number.parseInt(raw.slice(pipe + 1), 10);
    if (!userId || Number.isNaN(pv)) {
      return null;
    }
    return { userId, passwordVersion: pv };
  }

  private async issueTokenPair(
    user: JwtUser,
    passwordVersion: number,
  ): Promise<IssuedTokens> {
    const accessJti = randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      jti: accessJti,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.accessTokenTtlSeconds}s`,
    });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.setRefreshToken(refreshToken, {
      userId: user.id,
      passwordVersion,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  private toPublicTokenPair(tokens: IssuedTokens): PublicTokenPair {
    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }

  private refreshKey(refreshToken: string): string {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    return `auth:refresh:${tokenHash}`;
  }

  private accessRevokeKey(jti: string): string {
    return `auth:access:revoked:${jti}`;
  }

  private async revokeAccessToken(
    jti: string,
    accessExp?: number,
  ): Promise<void> {
    const fallbackTtlMs = this.accessTokenTtlSeconds * 1000;
    const expiresAt = accessExp ? accessExp * 1000 : Date.now() + fallbackTtlMs;
    const ttlMs = Math.max(expiresAt - Date.now(), 1000);
    const key = this.accessRevokeKey(jti);
    if (this.useInMemoryStore) {
      this.revokedAccessStore.set(key, Date.now() + ttlMs);
      return;
    }
    if (!this.redis) {
      return;
    }
    await this.redis.set(key, '1', 'PX', ttlMs);
  }

  private async setRefreshToken(
    refreshToken: string,
    session: RefreshSession,
  ): Promise<void> {
    const stored = this.refreshSessionStorageValue(session);
    if (this.useInMemoryStore) {
      this.refreshTokenStore.set(this.refreshKey(refreshToken), stored);
      return;
    }
    if (!this.redis) {
      throw new UnauthorizedException('Refresh token store is unavailable');
    }
    await this.redis.set(
      this.refreshKey(refreshToken),
      stored,
      'PX',
      this.refreshTokenTtlMs,
    );
  }

  private async getRefreshSession(
    refreshToken: string,
  ): Promise<RefreshSession | null> {
    const key = this.refreshKey(refreshToken);
    let raw: string | null;
    if (this.useInMemoryStore) {
      raw = this.refreshTokenStore.get(key) ?? null;
      if (!raw) {
        return null;
      }
      return this.parseLegacyOrSessionValue(raw);
    }
    if (!this.redis) {
      return null;
    }
    raw = await this.redis.get(key);
    return this.parseLegacyOrSessionValue(raw);
  }

  /** Accept legacy refresh values that stored only userId (pre passwordVersion). */
  private parseLegacyOrSessionValue(raw: string | null): RefreshSession | null {
    if (!raw) {
      return null;
    }
    if (!raw.includes('|')) {
      return { userId: raw, passwordVersion: 0 };
    }
    return this.parseRefreshStorageValue(raw);
  }

  private async deleteRefreshToken(refreshToken: string): Promise<void> {
    const key = this.refreshKey(refreshToken);
    if (this.useInMemoryStore) {
      this.refreshTokenStore.delete(key);
      return;
    }
    if (!this.redis) {
      return;
    }
    await this.redis.del(key);
  }

  async issueLoginTokens(
    email: string,
    password: string,
    correlationId?: string,
  ): Promise<{
    user: JwtUser;
    tokenPair: PublicTokenPair;
    refreshToken: string;
    mustChangePassword: boolean;
    mfaRequired: boolean;
  }> {
    const normEmail = this.loginAttemptService.normalizeEmail(email);
    await this.loginAttemptService.ensureEmailNotLockedAsync(normEmail);

    const user = await this.userService.findActiveByEmail(normEmail);
    if (!user) {
      await this.recordFailedLogin(normEmail, email, correlationId, undefined);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await this.recordFailedLogin(normEmail, email, correlationId, user.id);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!isBcryptHash(user.passwordHash)) {
      await this.userService.updatePasswordHash(
        user.id,
        bcrypt.hashSync(password, getBcryptCostFactor()),
      );
    }

    await this.loginAttemptService.clearFailures(normEmail);
    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    const issuedTokens = await this.issueTokenPair(
      authUser,
      user.passwordVersion,
    );
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_LOGIN_SUCCEEDED,
      actorUserId: authUser.id,
      correlationId,
      metadata: { email: authUser.email },
    });
    return {
      user: authUser,
      tokenPair: this.toPublicTokenPair(issuedTokens),
      refreshToken: issuedTokens.refreshToken,
      mustChangePassword: user.mustChangePassword,
      mfaRequired: user.mfaEnabled,
    };
  }

  private async recordFailedLogin(
    normalizedEmail: string,
    rawEmailForAudit: string,
    correlationId: string | undefined,
    actorUserId: string | undefined,
  ): Promise<void> {
    const activated =
      await this.loginAttemptService.recordFailedAttempt(normalizedEmail);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_LOGIN_FAILED,
      actorUserId,
      correlationId,
      metadata: {
        email: rawEmailForAudit,
        reason: actorUserId ? 'invalid_password' : 'user_not_found',
      },
    });
    if (activated) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGIN_LOCKED,
        actorUserId,
        correlationId,
        metadata: { email: rawEmailForAudit },
      });
    }
  }

  async rotateRefreshToken(
    refreshToken: string,
    correlationId?: string,
  ): Promise<{ tokenPair: PublicTokenPair; refreshToken: string }> {
    const session = await this.getRefreshSession(refreshToken);
    if (!session) {
      await this.deleteRefreshToken(refreshToken);
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_REFRESH_FAILED,
        correlationId,
        metadata: { reason: 'refresh_token_not_found' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userService.findActiveById(session.userId);
    if (!user || user.passwordVersion !== session.passwordVersion) {
      await this.deleteRefreshToken(refreshToken);
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_REFRESH_FAILED,
        actorUserId: session.userId,
        correlationId,
        metadata: { reason: 'user_not_found_or_stale_refresh' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.deleteRefreshToken(refreshToken);
    const issuedTokens = await this.issueTokenPair(
      this.toAuthUser(user.id, user.email, user.userRoles),
      user.passwordVersion,
    );
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_REFRESH_SUCCEEDED,
      actorUserId: user.id,
      correlationId,
    });
    return {
      tokenPair: this.toPublicTokenPair(issuedTokens),
      refreshToken: issuedTokens.refreshToken,
    };
  }

  private toAuthUser(
    id: string,
    email: string,
    userRoles: Array<{
      role: {
        name: string;
        rolePermissions: Array<{ permission: { code: string } }>;
      };
    }>,
  ): JwtUser {
    const permissions = Array.from(
      new Set(
        userRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map(
            (rolePermission) => rolePermission.permission.code,
          ),
        ),
      ),
    );
    return {
      id,
      email,
      roles: userRoles.map((userRole) => userRole.role.name),
      permissions,
    };
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    if (isBcryptHash(storedHash)) {
      return bcrypt.compareSync(password, storedHash);
    }
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }
    return comparePassword(password, expectedHash, salt);
  }

  async describeMfaStatus(userId: string): Promise<{
    enrolled: boolean;
    method: 'totp' | 'email' | null;
    provider: 'totp';
    policy: 'optional' | 'required';
    mustEnroll: boolean;
    totpOnly: boolean;
    canSkipEnroll: boolean;
  }> {
    const user = await this.userService.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    const rolePolicy = this.mfaService.isRequiredForRole(
      user.userRoles.map((userRole) => userRole.role.name),
    );
    const policy = rolePolicy.required ? 'required' : 'optional';
    // Onboarding MFA is always recommended; any role may defer until they enroll.
    const mustEnroll = false;
    const canSkipEnroll = !user.mfaEnabled;
    return {
      enrolled: user.mfaEnabled,
      method: (user.mfaMethod as 'totp' | 'email' | null) ?? null,
      provider: 'totp',
      policy,
      mustEnroll,
      totpOnly: rolePolicy.totpOnly,
      canSkipEnroll,
    };
  }

  async skipMfaEnrollment(
    userId: string,
    correlationId?: string,
  ): Promise<void> {
    const user = await this.userService.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enrolled.');
    }
    await this.userService.deferMfaEnrollment(userId);
    await this.auditMfaEvent('enroll_deferred', userId, correlationId);
  }

  async getSessionProfile(userId: string): Promise<{
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    mustChangePassword: boolean;
    mustEnrollMfa: boolean;
    requireMfaEnrollment: boolean;
    mfaEnrolled: boolean;
    mfaMethod: 'totp' | 'email' | null;
    canSkipMfaEnroll: boolean;
  }> {
    const user = await this.userService.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    const mfaStatus = await this.describeMfaStatus(userId);
    return {
      id: authUser.id,
      email: authUser.email,
      roles: authUser.roles,
      permissions: authUser.permissions,
      mustChangePassword: user.mustChangePassword,
      mustEnrollMfa: user.mustEnrollMfa,
      requireMfaEnrollment: mfaStatus.mustEnroll,
      mfaEnrolled: user.mfaEnabled,
      mfaMethod: mfaStatus.method,
      canSkipMfaEnroll: mfaStatus.canSkipEnroll,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    correlationId?: string,
  ): Promise<void> {
    const user = await this.userService.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    if (!this.verifyPassword(currentPassword, user.passwordHash)) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_PASSWORD_CHANGE_FAILED,
        actorUserId: userId,
        correlationId,
        metadata: { reason: 'invalid_current_password' },
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    this.assertStrongNewPassword(newPassword);

    const hash = bcrypt.hashSync(newPassword, getBcryptCostFactor());
    await this.userService.changePasswordWithVersionBump(userId, hash);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_PASSWORD_CHANGE_COMPLETED,
      actorUserId: userId,
      correlationId,
    });
  }

  async issueMfaToken(user: JwtUser): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'mfa' },
      { expiresIn: '5m' },
    );
  }

  async verifyMfaTokenAndIssueTokens(
    mfaToken: string,
    code: string | undefined,
    backupCode: string | undefined,
  ): Promise<{
    user: JwtUser;
    tokenPair: PublicTokenPair;
    refreshToken: string;
    mustChangePassword: boolean;
  }> {
    let payload: { sub: string; email: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        type: string;
      }>(mfaToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (payload.type !== 'mfa') {
      throw new UnauthorizedException('Invalid MFA token type');
    }

    let verified = false;
    if (code) {
      verified = await this.mfaService.verifyTotp(payload.sub, code);
    } else if (backupCode) {
      verified = await this.mfaService.verifyBackupCode(
        payload.sub,
        backupCode,
      );
    }

    if (!verified) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const user = await this.userService.findActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    const issuedTokens = await this.issueTokenPair(
      authUser,
      user.passwordVersion,
    );

    return {
      user: authUser,
      tokenPair: this.toPublicTokenPair(issuedTokens),
      refreshToken: issuedTokens.refreshToken,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async verifyUserPassword(userId: string, password: string): Promise<void> {
    const user = await this.userService.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Password is incorrect');
    }
  }

  async auditMfaEvent(
    action:
      | 'enrolled'
      | 'enroll_failed'
      | 'enroll_deferred'
      | 'verified'
      | 'verify_failed'
      | 'disabled'
      | 'method_changed',
    userId: string,
    correlationId?: string,
    metadata?: Record<string, string | number | boolean | null>,
  ): Promise<void> {
    const eventMap = {
      enrolled: AUDIT_EVENT.AUTH_MFA_ENROLLED,
      enroll_failed: AUDIT_EVENT.AUTH_MFA_ENROLL_FAILED,
      enroll_deferred: AUDIT_EVENT.AUTH_MFA_ENROLL_DEFERRED,
      verified: AUDIT_EVENT.AUTH_MFA_VERIFIED,
      verify_failed: AUDIT_EVENT.AUTH_MFA_VERIFY_FAILED,
      disabled: AUDIT_EVENT.AUTH_MFA_DISABLED,
      method_changed: AUDIT_EVENT.AUTH_MFA_METHOD_CHANGED,
    } as const;

    await this.auditService.logEvent({
      eventType: eventMap[action],
      actorUserId: userId,
      correlationId,
      metadata,
    });
  }

  /** SDS-aligned stub: issues a reset token stored in Redis (or memory in tests). */
  async requestPasswordReset(
    email: string,
    correlationId?: string,
  ): Promise<void> {
    const norm = this.loginAttemptService.normalizeEmail(email);
    const user = await this.userService.findActiveByEmail(norm);
    if (!user) {
      return;
    }
    const tokenPlain = randomBytes(32).toString('base64url');
    await this.persistPasswordResetToken(user.id, tokenPlain);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_PASSWORD_RESET_REQUESTED,
      actorUserId: user.id,
      correlationId,
      metadata: { email: norm },
    });

    try {
      await this.notificationsService.queuePasswordResetEmail(
        norm,
        tokenPlain,
        correlationId,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to queue password reset email for ${norm}: ${message}`,
      );
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.AUTH_PASSWORD_RESET_LOG_TOKEN === 'true'
    ) {
      this.logger.warn(
        `DEV ONLY password reset token for ${norm}: ${tokenPlain}`,
      );
    }
  }

  async completePasswordReset(
    tokenPlain: string,
    newPassword: string,
    correlationId?: string,
  ): Promise<void> {
    const userId = await this.takePasswordResetToken(tokenPlain);
    if (!userId) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_PASSWORD_RESET_FAILED,
        correlationId,
        metadata: { reason: 'invalid_or_expired_token' },
      });
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userService.findActiveById(userId);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    this.assertStrongNewPassword(newPassword);

    const hash = bcrypt.hashSync(newPassword, getBcryptCostFactor());
    await this.userService.resetPasswordWithVersionBump(userId, hash);
    await this.loginAttemptService.clearFailures(user.email);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.AUTH_PASSWORD_RESET_COMPLETED,
      actorUserId: userId,
      correlationId,
    });
  }

  private passwordResetKey(tokenPlain: string): string {
    return `auth:pwdreset:${createHash('sha256').update(tokenPlain).digest('hex')}`;
  }

  private async persistPasswordResetToken(
    userId: string,
    tokenPlain: string,
  ): Promise<void> {
    const key = this.passwordResetKey(tokenPlain);
    if (this.useInMemoryStore) {
      this.passwordResetStore.set(key, userId);
      return;
    }
    if (!this.redis) {
      throw new BadRequestException('Password reset store is unavailable');
    }
    await this.redis.psetex(key, this.passwordResetTokenTtlMs, userId);
  }

  private async takePasswordResetToken(
    tokenPlain: string,
  ): Promise<string | null> {
    const key = this.passwordResetKey(tokenPlain);
    if (this.useInMemoryStore) {
      const userId = this.passwordResetStore.get(key) ?? null;
      this.passwordResetStore.delete(key);
      return userId;
    }
    if (!this.redis) {
      return null;
    }
    const userId = await this.redis.get(key);
    if (userId) {
      await this.redis.del(key);
    }
    return userId;
  }

  private assertStrongNewPassword(password: string): void {
    if (!isStrongPassword(password)) {
      throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
    }
  }
}
