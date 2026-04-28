import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LogoutDto } from './dto/logout.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { JwtUser } from './interfaces/jwt-user.interface';
import { AuthService } from './auth.service';
import type { AuthLoginResult, TokenPair } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<{ data: AuthLoginResult }> {
    const loginResult = await this.authService.login(body.email, body.password);
    return {
      data: loginResult,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshDto): Promise<{ data: TokenPair }> {
    const refreshedTokens = await this.authService.refresh(body.refreshToken);
    return {
      data: refreshedTokens,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtUser,
    @Body() body: LogoutDto,
  ): Promise<{ data: { message: string } }> {
    await this.authService.logout(user.id, body.refreshToken);
    return {
      data: {
        message: 'Logged out successfully',
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @CurrentUser() user: JwtUser,
  ): { data: { id: string; email: string; roles: string[] } } {
    return {
      data: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}
