import { resolveApiV1Prefix } from "@/lib/api-origin";
import { apiGet, apiPost } from "@/lib/api-client";
import { buildReportFiltersQuery, type ReportFilters } from "./reports-filters";

export interface VolumeDashboardResponse {
  buckets: string[];
  series: Array<{ status: string; counts: number[] }>;
  events: {
    submitted: number[];
    closed: number[];
  };
  meta: {
    from: string;
    to: string;
    bucket: string;
    categoryId?: string;
    orgUnitId?: string;
    total: number;
  };
}

export interface SlaDashboardResponse {
  onTimePct: number;
  breachedPct: number;
  onTimeCount: number;
  breachedCount: number;
  activeCount: number;
  total: number;
  meta: {
    from: string;
    to: string;
    bucket: string;
    categoryId?: string;
    orgUnitId?: string;
  };
}

export interface ResolutionDashboardResponse {
  avgResolutionHours: number | null;
  resolutionRate: number;
  backlog: number;
  closedCount: number;
  createdCount: number;
  byBucket: Array<{ bucket: string; avgResolutionHours: number | null }>;
  meta: {
    from: string;
    to: string;
    bucket: string;
    categoryId?: string;
    orgUnitId?: string;
  };
}

export interface ChannelsDashboardResponse {
  channels: Array<{ channel: string; count: number }>;
  meta: {
    from: string;
    to: string;
    bucket: string;
    categoryId?: string;
    orgUnitId?: string;
    total: number;
  };
}

export interface CreateReportExportPayload extends ReportFilters {
  format: "csv" | "xlsx" | "pdf";
  reportType: "complaints" | "executive";
}

export interface ReportExportJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED" | "EXPIRED";
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export interface ReportExportDownload {
  url: string;
  expiresAt: string;
  status?: string;
}

export function buildReportExportDownloadPath(exportId: string): string {
  return `${resolveApiV1Prefix()}/reports/export/${exportId}/download`;
}

export async function getVolumeDashboard(
  filters: ReportFilters,
): Promise<VolumeDashboardResponse> {
  return apiGet<VolumeDashboardResponse>(
    `/reports/dashboard/volume${buildReportFiltersQuery(filters)}`,
  );
}

export async function getSlaDashboard(
  filters: ReportFilters,
): Promise<SlaDashboardResponse> {
  return apiGet<SlaDashboardResponse>(
    `/reports/dashboard/sla${buildReportFiltersQuery(filters)}`,
  );
}

export async function getResolutionDashboard(
  filters: ReportFilters,
): Promise<ResolutionDashboardResponse> {
  return apiGet<ResolutionDashboardResponse>(
    `/reports/dashboard/resolution${buildReportFiltersQuery(filters)}`,
  );
}

export async function getChannelsDashboard(
  filters: ReportFilters,
): Promise<ChannelsDashboardResponse> {
  return apiGet<ChannelsDashboardResponse>(
    `/reports/dashboard/channels${buildReportFiltersQuery(filters)}`,
  );
}

export async function createReportExport(
  payload: CreateReportExportPayload,
): Promise<Pick<ReportExportJob, "id" | "status" | "createdAt">> {
  return apiPost<Pick<ReportExportJob, "id" | "status" | "createdAt">>(
    "/reports/export",
    payload,
  );
}

export async function getReportExportStatus(
  exportId: string,
): Promise<ReportExportJob> {
  return apiGet<ReportExportJob>(`/reports/export/${exportId}`);
}

export async function getReportExportDownload(
  exportId: string,
): Promise<ReportExportDownload> {
  return apiGet<ReportExportDownload>(`/reports/export/${exportId}/download`);
}
