import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
import {
  MfaEnrollmentResponseDto,
  MfaStatusResponseDto,
  MfaVerifyResponseDto,
} from './dto/mfa-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MfaConfirmDto } from './dto/mfa-confirm.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';
import { MfaRegenerateBackupCodesDto } from './dto/mfa-regenerate-backup-codes.dto';
import { MfaMethodDto } from './dto/mfa-method.dto';
import type { JwtUser } from './interfaces/jwt-user.interface';
import { AuthService } from './auth.service';
import type { PublicTokenPair } from './auth.service';
import { MfaService } from './mfa.service';
import type { MfaEnrollmentResult } from './mfa.service';

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

  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

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
      user?: JwtUser;
      accessToken?: string;
      tokenType?: 'Bearer';
      expiresIn?: number;
      mustChangePassword: boolean;
      mfaRequired: boolean;
      mfaToken?: string;
    };
  }> {
    const loginResult = await this.authService.issueLoginTokens(
      body.email,
      body.password,
      request.correlationId,
    );

    if (loginResult.mfaRequired) {
      const mfaToken = await this.authService.issueMfaToken(loginResult.user);
      return {
        data: {
          mustChangePassword: loginResult.mustChangePassword,
          mfaRequired: true,
          mfaToken,
        },
      };
    }

    this.setRefreshCookie(response, loginResult.refreshToken);
    return {
      data: {
        ...loginResult.tokenPair,
        user: loginResult.user,
        mustChangePassword: loginResult.mustChangePassword,
        mfaRequired: false,
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

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password while logged in' })
  @ApiOkResponse({ description: 'Password changed successfully.' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Body() body: ChangePasswordDto,
  ): Promise<{ data: { message: string } }> {
    await this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
      request.correlationId,
    );
    return {
      data: { message: 'Password changed successfully.' },
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset (queues email via notifications module)',
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
    summary: 'MFA enrollment status and org policy',
    description:
      'Returns whether the user has enrolled TOTP MFA and whether MFA is optional or required (AUTH_MFA_REQUIRED).',
  })
  @ApiOkResponse({
    description: 'MFA enrollment and policy status.',
    type: MfaStatusResponseDto,
  })
  async mfaStatus(@CurrentUser() user: JwtUser): Promise<{
    data: Awaited<ReturnType<AuthService['describeMfaStatus']>>;
  }> {
    const status = await this.authService.describeMfaStatus(user.id);
    return { data: status };
  }

  @Post('mfa/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start TOTP MFA enrollment (returns QR code + backup codes)',
  })
  @ApiOkResponse({
    description:
      'Enrollment payload with QR code, secret, and one-time backup codes.',
    type: MfaEnrollmentResponseDto,
  })
  async mfaEnroll(
    @CurrentUser() user: JwtUser,
  ): Promise<{ data: MfaEnrollmentResult }> {
    const result = await this.mfaService.generateEnrollment(
      user.id,
      user.email,
    );
    return { data: result };
  }

  @Post('mfa/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm TOTP enrollment with 6-digit code' })
  async mfaConfirm(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Body() body: MfaConfirmDto,
  ): Promise<{ data: { message: string } }> {
    const confirmed = await this.mfaService.confirmEnrollment(
      user.id,
      body.code,
    );
    if (!confirmed) {
      await this.authService.auditMfaEvent(
        'enroll_failed',
        user.id,
        request.correlationId,
      );
      throw new BadRequestException('Invalid TOTP code');
    }
    await this.authService.auditMfaEvent(
      'enrolled',
      user.id,
      request.correlationId,
    );
    return { data: { message: 'MFA enrollment confirmed.' } };
  }

  @Post('mfa/skip')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Defer optional MFA enrollment (admin-created users cannot skip)',
  })
  async mfaSkip(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: { message: string } }> {
    await this.authService.skipMfaEnrollment(user.id, request.correlationId);
    return {
      data: { message: 'You can enable MFA later from Profile → MFA.' },
    };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify MFA code during login challenge and issue real tokens',
    description:
      'Send the mfaToken from POST /auth/login as Authorization: Bearer <mfaToken>. Body: TOTP code or backupCode.',
  })
  @ApiOkResponse({
    description:
      'MFA verified; issues access token and sets refresh_token cookie.',
    type: MfaVerifyResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired mfaToken, or wrong MFA code.',
    type: ErrorResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async mfaVerify(
    @Req()
    request: RequestWithCorrelationId & { headers: { authorization?: string } },
    @Res({ passthrough: true }) response: Response,
    @Body() body: MfaVerifyDto,
  ): Promise<{
    data: {
      user: JwtUser;
      accessToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
      mustChangePassword: boolean;
    };
  }> {
    if (!body.code && !body.backupCode) {
      throw new BadRequestException('Provide either code or backupCode');
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('MFA token is required');
    }
    const mfaToken = authHeader.slice(7);

    const result = await this.authService.verifyMfaTokenAndIssueTokens(
      mfaToken,
      body.code,
      body.backupCode,
    );

    await this.authService.auditMfaEvent(
      'verified',
      result.user.id,
      request.correlationId,
    );

    this.setRefreshCookie(response, result.refreshToken);
    return {
      data: {
        ...result.tokenPair,
        user: result.user,
        mustChangePassword: result.mustChangePassword,
      },
    };
  }

  @Patch('mfa/method')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch MFA method (requires re-verification)' })
  async mfaMethodSwitch(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Body() body: MfaMethodDto,
  ): Promise<{ data: { message: string } }> {
    const policy = this.mfaService.isRequiredForRole(user.roles);
    if (policy.totpOnly && body.method === 'email') {
      throw new ForbiddenException(
        'SuperAdmin/SystemAdmin cannot downgrade to email MFA',
      );
    }
    await this.mfaService.updateMfaMethod(user.id, body.method);
    await this.authService.auditMfaEvent(
      'method_changed',
      user.id,
      request.correlationId,
      { newMethod: body.method },
    );
    return { data: { message: `MFA method switched to ${body.method}.` } };
  }

  @Delete('mfa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Disable MFA (requires password re-entry; blocked for elevated roles)',
  })
  async mfaDisable(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Body() body: MfaDisableDto,
  ): Promise<{ data: { message: string } }> {
    const policy = this.mfaService.isRequiredForRole(user.roles);
    if (policy.required && policy.totpOnly) {
      throw new ForbiddenException(
        'MFA cannot be disabled for SuperAdmin/SystemAdmin roles',
      );
    }
    await this.authService.verifyUserPassword(user.id, body.password);
    await this.mfaService.disableMfa(user.id);
    await this.authService.auditMfaEvent(
      'disabled',
      user.id,
      request.correlationId,
    );
    return { data: { message: 'MFA has been disabled.' } };
  }

  @Post('mfa/backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Regenerate MFA backup codes (requires password; invalidates old codes)',
  })
  @ApiOkResponse({ type: MfaEnrollmentResponseDto })
  async mfaRegenerateBackupCodes(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Body() body: MfaRegenerateBackupCodesDto,
  ): Promise<{ data: { backupCodes: string[] } }> {
    await this.authService.verifyUserPassword(user.id, body.password);
    const backupCodes = await this.mfaService.regenerateBackupCodes(user.id);
    await this.authService.auditMfaEvent(
      'backup_codes_regenerated',
      user.id,
      request.correlationId,
    );
    return { data: { backupCodes } };
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
  async me(@CurrentUser() user: JwtUser): Promise<{
    data: Awaited<ReturnType<AuthService['getSessionProfile']>>;
  }> {
    const data = await this.authService.getSessionProfile(user.id);
    return { data };
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
