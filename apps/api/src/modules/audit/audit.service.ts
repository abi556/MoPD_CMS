import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { auditLogsToCsv } from './audit-csv.util';
import { AUDIT_EVENT, AuditEventInput } from './audit-event.types';
import {
  decodeAuditCursor,
  encodeAuditCursor,
  InvalidAuditCursorError,
} from './audit-cursor.util';
import {
  AuditLogListFilters,
  buildAuditLogWhere,
  validateAuditLogDateRange,
} from './audit-log-filters';

export interface AuditLogListParams extends AuditLogListFilters {
  limit?: number;
  cursor?: string;
}

export interface AuditLogListResult {
  data: AuditLog[];
  meta: { hasNext: boolean; nextCursor: string | null };
}

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;
const DEFAULT_EXPORT_MAX_ROWS = 10_000;

function getExportMaxRows(): number {
  const raw = process.env.AUDIT_EXPORT_MAX_ROWS;
  if (!raw) {
    return DEFAULT_EXPORT_MAX_ROWS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_EXPORT_MAX_ROWS;
  }
  return parsed;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(event: AuditEventInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: event.eventType,
          actorUserId: event.actorUserId ?? null,
          actorRole: event.actorRole ?? event.actorRoles?.[0] ?? null,
          entityType: event.entityType ?? null,
          entityId: event.entityId ?? null,
          correlationId: event.correlationId ?? null,
          metadata: event.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist audit event: ${event.eventType}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async listAuditLogs(params: AuditLogListParams): Promise<AuditLogListResult> {
    const filters = this.normalizeFilters(params);
    this.assertValidDateRange(filters);

    const limit = Math.min(
      Math.max(params.limit ?? DEFAULT_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );

    let cursorPayload;
    if (params.cursor) {
      try {
        cursorPayload = decodeAuditCursor(params.cursor);
      } catch (error) {
        if (error instanceof InvalidAuditCursorError) {
          throw new BadRequestException({
            error: {
              code: 'validation_error',
              message: 'Invalid cursor',
            },
          });
        }
        throw error;
      }
    }

    const rows = await this.prisma.auditLog.findMany({
      where: buildAuditLogWhere(filters, cursorPayload),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasNext = rows.length > limit;
    const page = hasNext ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      data: page,
      meta: {
        hasNext,
        nextCursor:
          hasNext && last
            ? encodeAuditCursor({
                createdAt: last.createdAt,
                id: last.id,
              })
            : null,
      },
    };
  }

  async exportAuditLogsCsv(
    params: AuditLogListParams & { actorUserIdForAudit?: string },
  ): Promise<string> {
    const filters = this.normalizeFilters(params);
    this.assertValidDateRange(filters);

    const maxRows = getExportMaxRows();
    const rows = await this.prisma.auditLog.findMany({
      where: buildAuditLogWhere(filters),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: maxRows + 1,
    });

    if (rows.length > maxRows) {
      throw new UnprocessableEntityException({
        error: {
          code: 'export_limit_exceeded',
          message: `Export exceeds maximum of ${maxRows} rows. Narrow your filters.`,
        },
      });
    }

    if (params.actorUserIdForAudit) {
      await this.logEvent({
        eventType: AUDIT_EVENT.AUDIT_EXPORT_REQUESTED,
        actorUserId: params.actorUserIdForAudit,
        entityType: 'audit_export',
        metadata: {
          eventType: filters.eventType ?? null,
          actorUserId: filters.actorUserId ?? null,
          entityType: filters.entityType ?? null,
          entityId: filters.entityId ?? null,
          createdFrom: filters.createdFrom?.toISOString() ?? null,
          createdTo: filters.createdTo?.toISOString() ?? null,
          rowCount: rows.length,
        },
      });
    }

    return auditLogsToCsv(rows);
  }

  private normalizeFilters(params: AuditLogListParams): AuditLogListFilters {
    return {
      eventType: params.eventType,
      actorUserId: params.actorUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
    };
  }

  private assertValidDateRange(filters: AuditLogListFilters): void {
    try {
      validateAuditLogDateRange(filters);
    } catch {
      throw new UnprocessableEntityException({
        error: {
          code: 'validation_error',
          message: 'createdFrom must be on or before createdTo',
        },
      });
    }
  }
}
