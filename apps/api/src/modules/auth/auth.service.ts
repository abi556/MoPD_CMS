import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import bcrypt from 'bcrypt';
import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { UserService } from '../user/user.service';
import { JwtPayload, JwtUser } from './interfaces/jwt-user.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthLoginResult extends TokenPair {
  user: JwtUser;
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

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly accessTokenTtlSeconds = 900;
  private readonly refreshTokenTtlMs = getRefreshTtlMs();
  private readonly useInMemoryStore =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  private readonly refreshTokenStore = new Map<string, string>();
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
  ) {}

  async onModuleInit(): Promise<void> {
    await this.userService.ensureSeedUsers();
  }

  async login(email: string, password: string): Promise<AuthLoginResult> {
    const user = await this.userService.findActiveByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!isBcryptHash(user.passwordHash)) {
      await this.userService.updatePasswordHash(
        user.id,
        bcrypt.hashSync(password, getBcryptCostFactor()),
      );
    }

    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    const tokenPair = await this.issueTokenPair(authUser);
    return {
      ...tokenPair,
      user: authUser,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const userId = await this.getRefreshUserId(refreshToken);
    if (!userId) {
      await this.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findActiveById(userId);
    if (!user) {
      await this.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // One-time-use refresh token rotation.
    await this.deleteRefreshToken(refreshToken);
    const issuedTokens = await this.issueTokenPair(
      this.toAuthUser(user.id, user.email, user.userRoles),
    );
    return issuedTokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenUserId = await this.getRefreshUserId(refreshToken);
    if (!tokenUserId || tokenUserId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.deleteRefreshToken(refreshToken);
  }

  async logoutByRefreshToken(refreshToken: string): Promise<void> {
    const tokenUserId = await this.getRefreshUserId(refreshToken);
    if (!tokenUserId) {
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
    const tokenUserId = await this.getRefreshUserId(refreshToken);
    if (!tokenUserId || tokenUserId !== userId) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGOUT_FAILED,
        actorUserId: userId,
        correlationId,
        metadata: { reason: 'refresh_token_invalid' },
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

  private async issueTokenPair(user: JwtUser): Promise<IssuedTokens> {
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
    await this.setRefreshToken(refreshToken, user.id);

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
    userId: string,
  ): Promise<void> {
    if (this.useInMemoryStore) {
      this.refreshTokenStore.set(this.refreshKey(refreshToken), userId);
      return;
    }
    if (!this.redis) {
      throw new UnauthorizedException('Refresh token store is unavailable');
    }
    await this.redis.set(
      this.refreshKey(refreshToken),
      userId,
      'PX',
      this.refreshTokenTtlMs,
    );
  }

  private async getRefreshUserId(refreshToken: string): Promise<string | null> {
    const key = this.refreshKey(refreshToken);
    if (this.useInMemoryStore) {
      return this.refreshTokenStore.get(key) ?? null;
    }
    if (!this.redis) {
      return null;
    }
    return this.redis.get(key);
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
  }> {
    const user = await this.userService.findActiveByEmail(email);
    if (!user) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGIN_FAILED,
        correlationId,
        metadata: { email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        correlationId,
        metadata: { email, reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!isBcryptHash(user.passwordHash)) {
      await this.userService.updatePasswordHash(
        user.id,
        bcrypt.hashSync(password, getBcryptCostFactor()),
      );
    }
    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    const issuedTokens = await this.issueTokenPair(authUser);
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
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
    correlationId?: string,
  ): Promise<{ tokenPair: PublicTokenPair; refreshToken: string }> {
    const userId = await this.getRefreshUserId(refreshToken);
    if (!userId) {
      await this.deleteRefreshToken(refreshToken);
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_REFRESH_FAILED,
        correlationId,
        metadata: { reason: 'refresh_token_not_found' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userService.findActiveById(userId);
    if (!user) {
      await this.deleteRefreshToken(refreshToken);
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.AUTH_REFRESH_FAILED,
        actorUserId: userId,
        correlationId,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.deleteRefreshToken(refreshToken);
    const issuedTokens = await this.issueTokenPair(
      this.toAuthUser(user.id, user.email, user.userRoles),
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
}
