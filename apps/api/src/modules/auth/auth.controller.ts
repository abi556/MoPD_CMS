import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LogoutDto } from './dto/logout.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { JwtUser } from './interfaces/jwt-user.interface';
import { AuthService } from './auth.service';
import type { AuthLoginResult, TokenPair } from './auth.service';

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
  @ApiUnprocessableEntityResponse({
    description: 'Request body failed validation.',
    type: ErrorResponseDto,
  })
  async login(@Body() body: LoginDto): Promise<{ data: AuthLoginResult }> {
    const loginResult = await this.authService.login(body.email, body.password);
    return {
      data: loginResult,
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
  @ApiUnprocessableEntityResponse({
    description: 'Request body failed validation.',
    type: ErrorResponseDto,
  })
  async refresh(@Body() body: RefreshDto): Promise<{ data: TokenPair }> {
    const refreshedTokens = await this.authService.refresh(body.refreshToken);
    return {
      data: refreshedTokens,
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
  @ApiUnprocessableEntityResponse({
    description: 'Request body failed validation.',
    type: ErrorResponseDto,
  })
  logout(
    @CurrentUser() user: JwtUser,
    @Body() body: LogoutDto,
  ): { data: { message: string } } {
    this.authService.logout(user.id, body.refreshToken);
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
}
