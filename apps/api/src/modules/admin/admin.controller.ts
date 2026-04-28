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
import { Roles } from '../../common/decorators/roles.decorator';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
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
