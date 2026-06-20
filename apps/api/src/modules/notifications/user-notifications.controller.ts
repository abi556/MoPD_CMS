import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { UserNotification } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { ListUserNotificationsQueryDto } from './dto/list-user-notifications.query.dto';
import {
  UserNotificationEnvelopeDto,
  UserNotificationItemDto,
  UserNotificationListEnvelopeDto,
  UserNotificationMarkAllReadEnvelopeDto,
  UserNotificationUnreadCountEnvelopeDto,
} from './dto/user-notification.response.dto';
import { InAppNotificationService } from './in-app-notification.service';

function toUserNotificationDto(row: UserNotification): UserNotificationItemDto {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    messageKey: row.messageKey,
    messageParams:
      row.messageParams && typeof row.messageParams === 'object'
        ? (row.messageParams as Record<string, unknown>)
        : null,
    link: row.link,
    entityType: row.entityType,
    entityId: row.entityId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/notifications')
export class UserNotificationsController {
  constructor(private readonly inAppNotifications: InAppNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for current user' })
  @ApiOkResponse({ type: UserNotificationListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListUserNotificationsQueryDto,
  ): Promise<UserNotificationListEnvelopeDto> {
    const result = await this.inAppNotifications.listForUser(user.id, {
      page: query.page,
      pageSize: query.pageSize,
      unreadOnly: query.unreadOnly,
    });
    return {
      data: result.data.map(toUserNotificationDto),
      meta: result.meta,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread in-app notification count' })
  @ApiOkResponse({ type: UserNotificationUnreadCountEnvelopeDto })
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async unreadCount(
    @CurrentUser() user: JwtUser,
  ): Promise<UserNotificationUnreadCountEnvelopeDto> {
    const count = await this.inAppNotifications.countUnread(user.id);
    return { data: { count } };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiOkResponse({ type: UserNotificationEnvelopeDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async markRead(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ): Promise<UserNotificationEnvelopeDto> {
    const row = await this.inAppNotifications.markRead(user.id, id);
    return { data: toUserNotificationDto(row) };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ type: UserNotificationMarkAllReadEnvelopeDto })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async markAllRead(
    @CurrentUser() user: JwtUser,
  ): Promise<UserNotificationMarkAllReadEnvelopeDto> {
    const result = await this.inAppNotifications.markAllRead(user.id);
    return { data: result };
  }
}
