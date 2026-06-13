export interface ComplaintQueueFilters {
  page: number;
  pageSize: number;
  status?: string;
  channel?: string;
  locale?: string;
  submittedFrom?: string;
  submittedTo?: string;
  queue?: string;
}

export const COMPLAINTS_FILTER_STORAGE_KEY = "mopd:complaints-queue-filters";

export const DEFAULT_QUEUE_FILTERS: ComplaintQueueFilters = {
  page: 1,
  pageSize: 20,
};

export function applyQueuePreset(
  filters: ComplaintQueueFilters,
): ComplaintQueueFilters {
  if (filters.queue === "triage") {
    return { ...filters, status: "TRIAGE", queue: undefined };
  }
  if (filters.queue === "qa") {
    return { ...filters, status: "QA_LEGAL_REVIEW", queue: undefined };
  }
  return filters;
}

export function parseComplaintFiltersFromSearch(
  search: URLSearchParams,
): ComplaintQueueFilters {
  const page = Number.parseInt(search.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(search.get("pageSize") ?? "20", 10);
  return {
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    pageSize: Number.isNaN(pageSize) || pageSize < 1 ? 20 : pageSize,
    status: search.get("status") ?? undefined,
    channel: search.get("channel") ?? undefined,
    locale: search.get("locale") ?? undefined,
    submittedFrom: search.get("submittedFrom") ?? undefined,
    submittedTo: search.get("submittedTo") ?? undefined,
    queue: search.get("queue") ?? undefined,
  };
}

export function serializeComplaintFilters(
  filters: ComplaintQueueFilters,
): Record<string, string> {
  const resolved = applyQueuePreset(filters);
  const out: Record<string, string> = {};
  if (resolved.page > 1) out.page = String(resolved.page);
  if (resolved.pageSize !== 20) out.pageSize = String(resolved.pageSize);
  if (resolved.status) out.status = resolved.status;
  if (resolved.channel) out.channel = resolved.channel;
  if (resolved.locale) out.locale = resolved.locale;
  if (resolved.submittedFrom) out.submittedFrom = resolved.submittedFrom;
  if (resolved.submittedTo) out.submittedTo = resolved.submittedTo;
  return out;
}

export interface SavedFilterPreset {
  name: string;
  filters: Omit<ComplaintQueueFilters, "page">;
}

export function loadSavedFilterPresets(): SavedFilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLAINTS_FILTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedFilterPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFilterPreset(preset: SavedFilterPreset): SavedFilterPreset[] {
  const existing = loadSavedFilterPresets().filter((p) => p.name !== preset.name);
  const next = [...existing, preset];
  localStorage.setItem(COMPLAINTS_FILTER_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteFilterPreset(name: string): SavedFilterPreset[] {
  const next = loadSavedFilterPresets().filter((p) => p.name !== name);
  localStorage.setItem(COMPLAINTS_FILTER_STORAGE_KEY, JSON.stringify(next));
  return next;
}
