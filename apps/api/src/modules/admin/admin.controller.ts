import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';

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
  constructor(private readonly auditService: AuditService) {}

  @Get('ping')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
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
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async ping(
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
  ) {
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.ADMIN_PING,
      actorUserId: user.id,
      actorRoles: user.roles,
      entityType: 'admin',
      entityId: 'ping',
      correlationId: request.correlationId,
    });
    return {
      data: {
        status: 'admin-ok',
      },
    };
  }
}
