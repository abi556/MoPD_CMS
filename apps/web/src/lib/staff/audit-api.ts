import { resolveApiV1Prefix } from "@/lib/api-origin";
import { apiGet } from "@/lib/api-client";

export interface AuditLogFilters {
  eventType?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  cursor?: string;
}

export interface AuditLogItem {
  id: string;
  eventType: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  correlationId?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export interface AuditLogListResponse {
  data: AuditLogItem[];
  meta: {
    hasNext: boolean;
    nextCursor?: string | null;
  };
}

export function buildAuditLogsQuery(filters: AuditLogFilters = {}): string {
  const search = new URLSearchParams();
  if (filters.eventType) search.set("eventType", filters.eventType);
  if (filters.actorUserId) search.set("actorUserId", filters.actorUserId);
  if (filters.entityType) search.set("entityType", filters.entityType);
  if (filters.entityId) search.set("entityId", filters.entityId);
  if (filters.createdFrom) search.set("createdFrom", filters.createdFrom);
  if (filters.createdTo) search.set("createdTo", filters.createdTo);
  if (filters.limit != null) search.set("limit", String(filters.limit));
  if (filters.cursor) search.set("cursor", filters.cursor);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function buildAuditLogsExportUrl(filters: AuditLogFilters = {}): string {
  return `${resolveApiV1Prefix()}/audit-logs/export${buildAuditLogsQuery(filters)}`;
}

export async function listAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLogListResponse> {
  return apiGet<AuditLogListResponse>(`/audit-logs${buildAuditLogsQuery(filters)}`);
}
