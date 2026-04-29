import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class AdminPingDataDto {
  @ApiProperty({
    example: 'admin-ok',
    description: 'Admin endpoint health state.',
  })
  status!: 'admin-ok';
}

class AdminPingResponseDto {
  @ApiProperty({
    type: AdminPingDataDto,
  })
  data!: AdminPingDataDto;
}

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  @Get('ping')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SuperAdmin')
  @Permissions('admin:ping')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only health check endpoint' })
  @ApiOkResponse({
    description: 'Admin endpoint is available.',
    type: AdminPingResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have required role.',
    type: ErrorResponseDto,
  })
  ping() {
    return {
      data: {
        status: 'admin-ok',
      },
    };
  }
}
