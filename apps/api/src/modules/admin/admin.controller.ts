import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  @Get('ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  ping() {
    return {
      data: {
        status: 'admin-ok',
      },
    };
  }
}
