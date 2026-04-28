import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtUser } from './interfaces/jwt-user.interface';

interface AuthUserRecord extends JwtUser {
  passwordHash: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthLoginResult extends TokenPair {
  user: JwtUser;
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

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds = 900;
  private readonly refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000;

  private readonly users: AuthUserRecord[];
  private readonly refreshTokenStore = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(private readonly jwtService: JwtService) {
    this.users = this.buildSeedUsers();
  }

  async login(email: string, password: string): Promise<AuthLoginResult> {
    const user = this.users.find((candidate) => candidate.email === email);
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

    const tokenPair = await this.issueTokenPair(user);
    return {
      ...tokenPair,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const refreshState = this.refreshTokenStore.get(refreshToken);
    if (!refreshState || refreshState.expiresAt < Date.now()) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = this.users.find(
      (candidate) => candidate.id === refreshState.userId,
    );
    if (!user) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // One-time-use refresh token rotation.
    this.refreshTokenStore.delete(refreshToken);
    return this.issueTokenPair(user);
  }

  logout(userId: string, refreshToken: string): void {
    const refreshState = this.refreshTokenStore.get(refreshToken);
    if (!refreshState || refreshState.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.refreshTokenStore.delete(refreshToken);
  }

  private async issueTokenPair(user: JwtUser): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.accessTokenTtlSeconds}s`,
    });
    const refreshToken = randomBytes(48).toString('base64url');
    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + this.refreshTokenTtlMs,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  private buildSeedUsers(): AuthUserRecord[] {
    return [
      this.createUser('user-admin-0001', 'admin@mopd.local', 'AdminPass123!', [
        'SuperAdmin',
      ]),
      this.createUser(
        'user-officer-0001',
        'officer@mopd.local',
        'OfficerPass123!',
        ['CaseOfficer'],
      ),
    ];
  }

  private createUser(
    id: string,
    email: string,
    password: string,
    roles: string[],
  ): AuthUserRecord {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${hashPassword(password, salt)}`;

    return {
      id,
      email,
      roles,
      passwordHash,
    };
  }
}
