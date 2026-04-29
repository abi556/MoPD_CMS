import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload, JwtUser } from '../interfaces/jwt-user.interface';

function getJwtSecret(): string {
  if (process.env.JWT_ACCESS_SECRET) {
    return process.env.JWT_ACCESS_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_SECRET must be configured in production');
  }

  return 'dev-jwt-access-secret-change-me';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid access token');
    }
    const isRevoked = await this.authService.isAccessTokenRevoked(payload.jti);
    if (isRevoked) {
      throw new UnauthorizedException('Access token has been revoked');
    }
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
