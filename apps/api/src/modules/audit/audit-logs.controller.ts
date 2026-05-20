import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuditLog } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AuditService } from './audit.service';
import {
  AuditLogItemDto,
  AuditLogListEnvelopeDto,
} from './dto/audit-log.response.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import type { AuditLogListParams } from './audit.service';

function toAuditLogItemDto(row: AuditLog): AuditLogItemDto {
  return {
    id: row.id,
    eventType: row.eventType,
    actorUserId: row.actorUserId,
    actorRole: row.actorRole,
    entityType: row.entityType,
    entityId: row.entityId,
    correlationId: row.correlationId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

function toListParams(query: ListAuditLogsQueryDto): AuditLogListParams {
  return {
    eventType: query.eventType,
    actorUserId: query.actorUserId,
    entityType: query.entityType,
    entityId: query.entityId,
    createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
    createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
    limit: query.limit,
    cursor: query.cursor,
  };
}

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Permissions('audit:read')
  @ApiOperation({ summary: 'List audit logs (cursor pagination, filterable)' })
  @ApiOkResponse({ type: AuditLogListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async list(
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<AuditLogListEnvelopeDto> {
    const result = await this.audit.listAuditLogs(toListParams(query));
    return {
      data: result.data.map(toAuditLogItemDto),
      meta: result.meta,
    };
  }

  @Get('export')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Permissions('audit:read')
  @ApiOperation({ summary: 'Export audit logs as CSV (sync, filterable)' })
  @ApiProduces('text/csv')
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async exportCsv(
    @Query() query: ListAuditLogsQueryDto,
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.audit.exportAuditLogsCsv({
      ...toListParams(query),
      actorUserIdForAudit: user.id,
    });
    const filename = `audit-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
