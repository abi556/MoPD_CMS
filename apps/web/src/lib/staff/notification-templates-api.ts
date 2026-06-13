import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export interface NotificationTemplateItem {
  id: string;
  key: string;
  locale: "en" | "am";
  channel: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateListResponse {
  data: NotificationTemplateItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTemplatePayload {
  key: string;
  locale: "en" | "am";
  channel: "email";
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export interface UpdateTemplatePayload {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
}

export async function listNotificationTemplates(params?: {
  page?: number;
  pageSize?: number;
}): Promise<NotificationTemplateListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return apiGet<NotificationTemplateListResponse>(
    `/notification-templates${qs ? `?${qs}` : ""}`,
  );
}

export async function getNotificationTemplate(
  id: string,
): Promise<NotificationTemplateItem> {
  return apiGet<NotificationTemplateItem>(`/notification-templates/${id}`);
}

export async function createNotificationTemplate(
  payload: CreateTemplatePayload,
): Promise<NotificationTemplateItem> {
  return apiPost<NotificationTemplateItem>("/notification-templates", payload);
}

export async function updateNotificationTemplate(
  id: string,
  payload: UpdateTemplatePayload,
): Promise<NotificationTemplateItem> {
  return apiPatch<NotificationTemplateItem>(
    `/notification-templates/${id}`,
    payload,
  );
}
