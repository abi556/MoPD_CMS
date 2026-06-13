import { apiGet } from "@/lib/api-client";

export interface ComplaintListItem {
  id: string;
  referenceNo: string;
  status: string;
  channel: string;
  subject: string;
  submittedAt: string;
  locale: string;
  categoryId: string | null;
  orgUnitId: string | null;
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

export interface ListComplaintsParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

function buildQuery(params: ListComplaintsParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listComplaints(
  params: ListComplaintsParams = {},
): Promise<ComplaintListResponse> {
  return apiGet<ComplaintListResponse>(`/complaints${buildQuery(params)}`);
}
