import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import {
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtUser } from './interfaces/jwt-user.interface';
import { AuthService } from './auth.service';
import type { PublicTokenPair } from './auth.service';

function getRefreshCookieName(): string {
  return process.env.AUTH_REFRESH_COOKIE_NAME || 'refresh_token';
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

function getCookieSecure(): boolean {
  if (process.env.AUTH_COOKIE_SECURE) {
    return process.env.AUTH_COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

function getCsrfTrustedOrigins(): string[] {
  const raw = process.env.AUTH_CSRF_TRUSTED_ORIGINS;
  if (!raw) {
    return ['http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function shouldEnforceCsrfOriginCheck(): boolean {
  const raw = process.env.AUTH_CSRF_ENFORCED;
  if (!raw) {
    return process.env.NODE_ENV === 'production';
  }
  return raw === 'true';
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly refreshCookieName = getRefreshCookieName();
  private readonly refreshCookieMaxAgeMs = getRefreshTtlMs();
  private readonly csrfTrustedOrigins = getCsrfTrustedOrigins();
  private readonly enforceCsrfOriginCheck = shouldEnforceCsrfOriginCheck();

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue tokens' })
  @ApiOkResponse({
    description: 'Authentication successful.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credentials are invalid.',
    type: ErrorResponseDto,
  })
  @ApiCookieAuth('refresh_token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Req() request: RequestWithCorrelationId,
    @Res({ passthrough: true }) response: Response,
    @Body() body: LoginDto,
  ): Promise<{
    data: {
      user: JwtUser;
      accessToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
    };
  }> {
    const loginResult = await this.authService.issueLoginTokens(
      body.email,
      body.password,
      request.correlationId,
    );
    this.setRefreshCookie(response, loginResult.refreshToken);
    return {
      data: {
        ...loginResult.tokenPair,
        user: loginResult.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue fresh token pair' })
  @ApiOkResponse({
    description: 'Token pair refreshed successfully.',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid or expired.',
    type: ErrorResponseDto,
  })
  @ApiCookieAuth('refresh_token')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async refresh(
    @Req() request: RequestWithCorrelationId,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: PublicTokenPair }> {
    this.enforceCookieAuthOrigin(request);
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const refreshedTokens = await this.authService.rotateRefreshToken(
      refreshToken,
      request.correlationId,
    );
    this.setRefreshCookie(response, refreshedTokens.refreshToken);
    return {
      data: refreshedTokens.tokenPair,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate refresh token and logout session' })
  @ApiOkResponse({
    description: 'Logout successful.',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token or refresh token is invalid.',
    type: ErrorResponseDto,
  })
  @ApiCookieAuth('refresh_token')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: { message: string } }> {
    this.enforceCookieAuthOrigin(request);
    if (!user.jti) {
      throw new UnauthorizedException('Invalid access token');
    }
    const refreshToken = this.getRefreshTokenFromCookie(request);
    await this.authService.logoutSession(
      user.id,
      refreshToken,
      user.jti,
      user.exp,
      request.correlationId,
    );
    response.clearCookie(this.refreshCookieName, this.getCookieOptions());
    return {
      data: {
        message: 'Logged out successfully',
      },
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset (email delivery not wired yet in MVP)',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(
    @Req() request: RequestWithCorrelationId,
    @Body() body: ForgotPasswordDto,
  ): Promise<{ data: { message: string } }> {
    await this.authService.requestPasswordReset(
      body.email,
      request.correlationId,
    );
    return {
      data: {
        message:
          'If an active account matches this email, password reset instructions will be processed.',
      },
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete password reset using emailed token' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async resetPassword(
    @Req() request: RequestWithCorrelationId,
    @Body() body: ResetPasswordDto,
  ): Promise<{ data: { message: string } }> {
    await this.authService.completePasswordReset(
      body.token,
      body.newPassword,
      request.correlationId,
    );
    return {
      data: {
        message: 'Password has been reset. Sign in with your new password.',
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'MFA enrollment status hook (enforcement off until TOTP ships)',
  })
  async mfaStatus(@CurrentUser() user: JwtUser): Promise<{
    data: {
      enrolled: boolean;
      provider: 'totp';
      policy: 'optional' | 'required';
    };
  }> {
    const status = await this.authService.describeMfaStatus(user.id);
    return { data: status };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return authenticated user profile' })
  @ApiOkResponse({
    description: 'Authenticated user profile.',
    type: MeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  me(@CurrentUser() user: JwtUser): {
    data: { id: string; email: string; roles: string[]; permissions: string[] };
  } {
    return {
      data: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  private getRefreshTokenFromCookie(request: Request): string {
    const cookies = request.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.[this.refreshCookieName];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return refreshToken;
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(
      this.refreshCookieName,
      refreshToken,
      this.getCookieOptions(),
    );
  }

  private getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    maxAge: number;
    path: string;
  } {
    return {
      httpOnly: true,
      secure: getCookieSecure(),
      sameSite: 'lax',
      maxAge: this.refreshCookieMaxAgeMs,
      path: '/api/v1/auth',
    };
  }

  private enforceCookieAuthOrigin(request: Request): void {
    if (!this.enforceCsrfOriginCheck) {
      return;
    }
    const source = request.header('origin') || request.header('referer');
    if (!source) {
      throw new ForbiddenException('Missing request origin');
    }

    const parsed = this.parseOrigin(source);
    if (!parsed) {
      throw new ForbiddenException('Invalid request origin');
    }

    const isTrusted = this.csrfTrustedOrigins.some(
      (trusted) => trusted === parsed,
    );
    if (!isTrusted) {
      throw new ForbiddenException('Untrusted request origin');
    }
  }

  private parseOrigin(raw: string): string | null {
    try {
      const url = new URL(raw);
      return url.origin;
    } catch {
      return null;
    }
  }
}
