export type ReportBucket = "day" | "week" | "month";

export interface ReportFilters {
  from: string;
  to: string;
  bucket?: ReportBucket;
  categoryId?: string;
  orgUnitId?: string;
}

export function buildReportFiltersQuery(filters: ReportFilters): string {
  const search = new URLSearchParams();
  search.set("from", filters.from);
  search.set("to", filters.to);
  if (filters.bucket) search.set("bucket", filters.bucket);
  if (filters.categoryId) search.set("categoryId", filters.categoryId);
  if (filters.orgUnitId) search.set("orgUnitId", filters.orgUnitId);
  const query = search.toString();
  return query ? `?${query}` : "";
}
