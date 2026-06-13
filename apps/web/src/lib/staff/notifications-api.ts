import { apiGet, apiPost } from "@/lib/api-client";

export type NotificationDeliveryStatus =
  | "queued"
  | "sent"
  | "failed"
  | "dead_letter";

export interface NotificationDeliveryItem {
  id: string;
  templateKey: string;
  to: string;
  channel: string;
  status: NotificationDeliveryStatus;
  retries: number;
  lastError: string | null;
  sentAt: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  data: NotificationDeliveryItem[];
  meta: NotificationListMeta;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  status?: NotificationDeliveryStatus;
  to?: string;
  templateKey?: string;
}

export function buildNotificationsQuery(params: ListNotificationsParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.to) search.set("to", params.to);
  if (params.templateKey) search.set("templateKey", params.templateKey);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationListResponse> {
  return apiGet<NotificationListResponse>(
    `/notifications${buildNotificationsQuery(params)}`,
  );
}

export async function resendNotification(
  id: string,
): Promise<{ newDeliveryId: string }> {
  return apiPost<{ newDeliveryId: string }>(`/notifications/${id}/resend`);
}
