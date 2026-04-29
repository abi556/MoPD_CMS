import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
import {
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly refreshCookieName = getRefreshCookieName();
  private readonly refreshCookieMaxAgeMs = getRefreshTtlMs();

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
  async login(
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
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: PublicTokenPair }> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const refreshedTokens =
      await this.authService.rotateRefreshToken(refreshToken);
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
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: { message: string } }> {
    if (!user.jti) {
      throw new UnauthorizedException('Invalid access token');
    }
    const refreshToken = this.getRefreshTokenFromCookie(request);
    await this.authService.logoutSession(
      user.id,
      refreshToken,
      user.jti,
      user.exp,
    );
    response.clearCookie(this.refreshCookieName, this.getCookieOptions());
    return {
      data: {
        message: 'Logged out successfully',
      },
    };
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
}
