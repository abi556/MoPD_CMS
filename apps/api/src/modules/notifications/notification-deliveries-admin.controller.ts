import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListNotificationDeliveriesQueryDto } from './dto/list-notification-deliveries.query.dto';
import {
  NotificationDeliveryItemDto,
  NotificationDeliveryListEnvelopeDto,
  NotificationResendEnvelopeDto,
} from './dto/notification-admin.response.dto';
import { NotificationsService } from './notifications.service';
import type { NotificationDelivery } from '@prisma/client';

function toDeliveryDto(row: NotificationDelivery): NotificationDeliveryItemDto {
  return {
    id: row.id,
    templateKey: row.templateKey,
    to: row.to,
    channel: row.channel,
    status: row.status,
    retries: row.retries,
    lastError: row.lastError,
    sentAt: row.sentAt?.toISOString() ?? null,
    correlationId: row.correlationId,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationDeliveriesAdminController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Permissions('config:manage')
  @ApiOperation({
    summary: 'List notification deliveries (paginated, filterable)',
  })
  @ApiOkResponse({ type: NotificationDeliveryListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async list(
    @Query() query: ListNotificationDeliveriesQueryDto,
  ): Promise<NotificationDeliveryListEnvelopeDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const result = await this.notifications.listDeliveries({
      page,
      pageSize,
      status: query.status,
      to: query.to,
      templateKey: query.templateKey,
    });
    return {
      data: result.data.map(toDeliveryDto),
      meta: result.meta,
    };
  }

  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Permissions('config:manage')
  @ApiOperation({
    summary:
      'Queue a new delivery copying template/payload from a previous one (not allowed while still queued)',
  })
  @ApiParam({ name: 'id', description: 'Prior notification delivery id' })
  @ApiOkResponse({ type: NotificationResendEnvelopeDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async resend(
    @Param('id') id: string,
  ): Promise<NotificationResendEnvelopeDto> {
    const newDeliveryId = await this.notifications.resendDelivery(id);
    return { data: { newDeliveryId } };
  }
}
