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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import type { JwtUser } from './interfaces/jwt-user.interface';
import { AuthService } from './auth.service';
import type { PublicTokenPair } from './auth.service';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
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
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
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

  @UseGuards(JwtAuthGuard)
  @Post('logout')
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
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: { message: string } }> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    await this.authService.logout(user.id, refreshToken);
    response.clearCookie(REFRESH_COOKIE_NAME, this.getCookieOptions());
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
    data: { id: string; email: string; roles: string[] };
  } {
    return {
      data: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  private getRefreshTokenFromCookie(request: Request): string {
    const cookies = request.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return refreshToken;
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, this.getCookieOptions());
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: '/api/v1/auth',
    };
  }
}
