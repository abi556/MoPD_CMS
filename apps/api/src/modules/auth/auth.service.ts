import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
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

function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REDIS_URL must be configured in production');
  }
  return 'redis://localhost:6379';
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly accessTokenTtlSeconds = 900;
  private readonly refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000;
  private readonly useInMemoryStore =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  private readonly refreshTokenStore = new Map<string, string>();
  private readonly redis = this.useInMemoryStore
    ? null
    : new Redis(getRedisUrl(), {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.userService.ensureSeedUsers();
  }

  async login(email: string, password: string): Promise<AuthLoginResult> {
    const user = await this.userService.findActiveByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const [salt, expectedHash] = user.passwordHash.split(':');
    if (
      !salt ||
      !expectedHash ||
      !comparePassword(password, expectedHash, salt)
    ) {
      throw new UnauthorizedException('Invalid credentials');
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

  private async issueTokenPair(user: JwtUser): Promise<IssuedTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
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
  ): Promise<{
    user: JwtUser;
    tokenPair: PublicTokenPair;
    refreshToken: string;
  }> {
    const user = await this.userService.findActiveByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const [salt, expectedHash] = user.passwordHash.split(':');
    if (
      !salt ||
      !expectedHash ||
      !comparePassword(password, expectedHash, salt)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const authUser = this.toAuthUser(user.id, user.email, user.userRoles);
    const issuedTokens = await this.issueTokenPair(authUser);
    return {
      user: authUser,
      tokenPair: this.toPublicTokenPair(issuedTokens),
      refreshToken: issuedTokens.refreshToken,
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<{ tokenPair: PublicTokenPair; refreshToken: string }> {
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
    await this.deleteRefreshToken(refreshToken);
    const issuedTokens = await this.issueTokenPair(
      this.toAuthUser(user.id, user.email, user.userRoles),
    );
    return {
      tokenPair: this.toPublicTokenPair(issuedTokens),
      refreshToken: issuedTokens.refreshToken,
    };
  }

  private toAuthUser(
    id: string,
    email: string,
    userRoles: Array<{ role: { name: string } }>,
  ): JwtUser {
    return {
      id,
      email,
      roles: userRoles.map((userRole) => userRole.role.name),
    };
  }
}
