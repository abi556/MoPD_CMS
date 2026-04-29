import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
export class AuthService implements OnModuleInit {
  private readonly accessTokenTtlSeconds = 900;
  private readonly refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000;
  private readonly refreshTokenStore = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

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
    const refreshState = this.refreshTokenStore.get(refreshToken);
    if (!refreshState || refreshState.expiresAt < Date.now()) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findActiveById(refreshState.userId);
    if (!user) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // One-time-use refresh token rotation.
    this.refreshTokenStore.delete(refreshToken);
    return this.issueTokenPair(
      this.toAuthUser(user.id, user.email, user.userRoles),
    );
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
