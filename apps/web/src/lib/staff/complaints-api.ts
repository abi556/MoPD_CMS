import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { ComplaintStatus } from "@/components/ui/status-badge";
import type { ComplaintSlaStatus } from "@/lib/staff/sla-status";

export type ComplaintPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface ComplaintListItem {
  id: string;
  referenceNo: string;
  status: ComplaintStatus;
  channel: string;
  subject: string;
  submittedAt: string;
  locale: string;
  categoryId: string | null;
  orgUnitId: string | null;
  assignedToUserId: string | null;
}

export interface ComplaintListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ComplaintListResponse {
  data: ComplaintListItem[];
  meta: ComplaintListMeta;
}

export interface ComplaintDetail {
  id: string;
  referenceNo: string;
  status: ComplaintStatus;
  channel: string;
  subject: string;
  description: string;
  submittedAt: string;
  locale: string;
  consentGiven: boolean;
  categoryId: string | null;
  orgUnitId: string | null;
  complainantName: string | null;
  complainantEmail: string | null;
  complainantPhone: string | null;
  assignedToUserId: string | null;
  assignedByUserId: string | null;
  assignedAt: string | null;
  assignmentReason: string | null;
  lastTransitionByUserId: string | null;
  lastTransitionAt: string | null;
  lastTransitionReason: string | null;
  priority: ComplaintPriority | null;
  responseDraft: string | null;
}

export interface ComplaintHistoryItem {
  id: string;
  action: "ASSIGNED" | "TRANSITIONED";
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  actorUserId: string;
  reason?: string;
  createdAt: string;
}

export interface ListComplaintsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  channel?: string;
  locale?: string;
  submittedFrom?: string;
  submittedTo?: string;
  q?: string;
}

export function buildComplaintsQuery(params: ListComplaintsParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.channel) search.set("channel", params.channel);
  if (params.locale) search.set("locale", params.locale);
  if (params.submittedFrom) search.set("submittedFrom", params.submittedFrom);
  if (params.submittedTo) search.set("submittedTo", params.submittedTo);
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listComplaints(
  params: ListComplaintsParams = {},
): Promise<ComplaintListResponse> {
  return apiGet<ComplaintListResponse>(`/complaints${buildComplaintsQuery(params)}`);
}

export async function getComplaint(id: string): Promise<ComplaintDetail> {
  return apiGet<ComplaintDetail>(`/complaints/${id}`);
}

export async function getComplaintHistory(
  id: string,
): Promise<ComplaintHistoryItem[]> {
  return apiGet<ComplaintHistoryItem[]>(`/complaints/${id}/history`);
}

export async function getComplaintSla(id: string): Promise<ComplaintSlaStatus> {
  return apiGet<ComplaintSlaStatus>(`/complaints/${id}/sla`);
}

export async function assignComplaint(
  id: string,
  payload: { assigneeUserId: string; reason?: string },
): Promise<ComplaintDetail> {
  return apiPost<ComplaintDetail>(`/complaints/${id}/assign`, payload);
}

export async function transitionComplaint(
  id: string,
  payload: { toStatus: ComplaintStatus; reason: string },
): Promise<ComplaintDetail> {
  return apiPost<ComplaintDetail>(`/complaints/${id}/transition`, payload);
}

export async function appealComplaint(
  id: string,
  payload: { reason: string },
): Promise<ComplaintDetail> {
  return apiPost<ComplaintDetail>(`/complaints/${id}/appeal`, payload);
}

export interface UpdateComplaintPayload {
  categoryId?: string;
  orgUnitId?: string;
  priority?: ComplaintPriority;
  responseDraft?: string | null;
}

export async function updateComplaint(
  id: string,
  payload: UpdateComplaintPayload,
): Promise<ComplaintDetail> {
  return apiPatch<ComplaintDetail>(`/complaints/${id}`, payload);
}

/** Fetch SLA for multiple complaints with bounded concurrency. */
export async function fetchSlaBatch(
  ids: string[],
  concurrency = 5,
): Promise<Map<string, ComplaintSlaStatus | null>> {
  const result = new Map<string, ComplaintSlaStatus | null>();
  const queue = [...ids];

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      try {
        result.set(id, await getComplaintSla(id));
      } catch {
        result.set(id, null);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, () => worker()),
  );
  return result;
}

export interface CreateAssistedComplaintPayload {
  subject: string;
  description: string;
  locale: "en" | "am";
  consentGiven: true;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  categoryId?: string;
  orgUnitId?: string;
}

export interface CreateAssistedComplaintResult {
  id: string;
  referenceNo: string;
}

export async function createAssistedComplaint(
  payload: CreateAssistedComplaintPayload,
): Promise<CreateAssistedComplaintResult> {
  return apiPost<CreateAssistedComplaintResult>(
    "/complaints",
    { ...payload, channel: "ASSISTED", requestUploadSession: false },
    { auth: true },
  );
}
