import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type InAppNotificationSeverity =
  | "info"
  | "success"
  | "warning"
  | "critical";

export type InAppNotificationType =
  | "complaint_assigned"
  | "case_task_assigned"
  | "case_task_reassigned"
  | "sla_warning"
  | "sla_breached"
  | "account_password_changed"
  | "account_email_changed"
  | "security_mfa_reminder"
  | "report_export_ready"
  | "report_export_failed";

export interface InAppNotificationItem {
  id: string;
  type: InAppNotificationType;
  severity: InAppNotificationSeverity;
  messageKey: string;
  messageParams: Record<string, unknown> | null;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface InAppNotificationListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InAppNotificationListResponse {
  data: InAppNotificationItem[];
  meta: InAppNotificationListMeta;
}

export interface ListInAppNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export function buildInAppNotificationsQuery(
  params: ListInAppNotificationsParams,
): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  if (params.unreadOnly) search.set("unreadOnly", "true");
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listInAppNotifications(
  params: ListInAppNotificationsParams = {},
): Promise<InAppNotificationListResponse> {
  return apiGet<InAppNotificationListResponse>(
    `/users/me/notifications${buildInAppNotificationsQuery(params)}`,
  );
}

export function extractUnreadCount(payload: unknown): number {
  if (!payload || typeof payload !== "object") {
    return 0;
  }
  if ("count" in payload) {
    const count = Number(payload.count);
    if (Number.isFinite(count) && count >= 0) {
      return count;
    }
  }
  if (
    "data" in payload &&
    payload.data &&
    typeof payload.data === "object" &&
    "count" in payload.data
  ) {
    const count = Number(payload.data.count);
    if (Number.isFinite(count) && count >= 0) {
      return count;
    }
  }
  return 0;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiGet<unknown>("/users/me/notifications/unread-count");
  return extractUnreadCount(res);
}

export async function markNotificationRead(
  id: string,
): Promise<InAppNotificationItem> {
  return apiPatch<InAppNotificationItem>(
    `/users/me/notifications/${id}/read`,
  );
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await apiPost<{ updated: number }>(
    "/users/me/notifications/read-all",
  );
  return res.updated;
}
