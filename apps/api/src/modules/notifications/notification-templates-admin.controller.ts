import {
  Body,
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
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { ListNotificationTemplatesQueryDto } from './dto/list-notification-templates.query.dto';
import {
  NotificationTemplateEnvelopeDto,
  NotificationTemplateItemDto,
  NotificationTemplateListEnvelopeDto,
} from './dto/notification-admin.response.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { NotificationsService } from './notifications.service';
import type { NotificationTemplate } from '@prisma/client';

function toTemplateDto(row: NotificationTemplate): NotificationTemplateItemDto {
  return {
    id: row.id,
    key: row.key,
    locale: row.locale,
    channel: row.channel,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@ApiTags('notification-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notification-templates')
export class NotificationTemplatesAdminController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Permissions('template:manage')
  @ApiOperation({ summary: 'List notification templates (paginated)' })
  @ApiOkResponse({ type: NotificationTemplateListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async list(
    @Query() query: ListNotificationTemplatesQueryDto,
  ): Promise<NotificationTemplateListEnvelopeDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const result = await this.notifications.listTemplates({ page, pageSize });
    return {
      data: result.data.map(toTemplateDto),
      meta: result.meta,
    };
  }

  @Get(':id')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Permissions('template:manage')
  @ApiOperation({ summary: 'Get one notification template by id' })
  @ApiParam({ name: 'id', description: 'Template id (UUID)' })
  @ApiOkResponse({ type: NotificationTemplateEnvelopeDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async getById(
    @Param('id') id: string,
  ): Promise<NotificationTemplateEnvelopeDto> {
    const row = await this.notifications.getTemplateById(id);
    return { data: toTemplateDto(row) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Permissions('template:manage')
  @ApiOperation({ summary: 'Create a notification template' })
  @ApiCreatedResponse({ type: NotificationTemplateEnvelopeDto })
  @ApiConflictResponse({
    description: 'Unique key + locale + channel violation',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async create(
    @Body() body: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplateEnvelopeDto> {
    const row = await this.notifications.createTemplate({
      key: body.key,
      locale: body.locale,
      channel: body.channel,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText,
    });
    return { data: toTemplateDto(row) };
  }

  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('template:manage')
  @ApiOperation({ summary: 'Update template copy (subject/body)' })
  @ApiParam({ name: 'id', description: 'Template id (UUID)' })
  @ApiOkResponse({ type: NotificationTemplateEnvelopeDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateNotificationTemplateDto,
  ): Promise<NotificationTemplateEnvelopeDto> {
    const patch: {
      subject?: string;
      bodyHtml?: string;
      bodyText?: string | null;
    } = {};
    if (body.subject !== undefined) {
      patch.subject = body.subject;
    }
    if (body.bodyHtml !== undefined) {
      patch.bodyHtml = body.bodyHtml;
    }
    if (body.bodyText !== undefined) {
      patch.bodyText = body.bodyText;
    }
    const row = await this.notifications.updateTemplate(id, patch);
    return { data: toTemplateDto(row) };
  }
}
