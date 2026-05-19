import { Prisma } from '@prisma/client';
import type { AuditCursorPayload } from './audit-cursor.util';

export interface AuditLogListFilters {
  eventType?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export function buildAuditLogWhere(
  filters: AuditLogListFilters,
  cursor?: AuditCursorPayload,
): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];

  if (filters.eventType) {
    and.push({ eventType: filters.eventType });
  }
  if (filters.actorUserId) {
    and.push({ actorUserId: filters.actorUserId });
  }
  if (filters.entityType) {
    and.push({ entityType: filters.entityType });
  }
  if (filters.entityId) {
    and.push({ entityId: filters.entityId });
  }
  if (filters.createdFrom) {
    and.push({ createdAt: { gte: filters.createdFrom } });
  }
  if (filters.createdTo) {
    and.push({ createdAt: { lte: filters.createdTo } });
  }
  if (cursor) {
    and.push({
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        {
          createdAt: cursor.createdAt,
          id: { lt: cursor.id },
        },
      ],
    });
  }

  if (and.length === 0) {
    return {};
  }
  return { AND: and };
}

export function validateAuditLogDateRange(filters: AuditLogListFilters): void {
  if (
    filters.createdFrom &&
    filters.createdTo &&
    filters.createdFrom.getTime() > filters.createdTo.getTime()
  ) {
    throw new Error('INVALID_DATE_RANGE');
  }
}
