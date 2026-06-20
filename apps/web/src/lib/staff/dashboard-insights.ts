import { apiGet } from "@/lib/api-client";

export interface TopCategoryItem {
  categoryId: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  count: number;
}

export interface QueueActivityItem {
  id: string;
  complaintId: string;
  referenceNo: string;
  subject: string;
  action: "ASSIGNED" | "TRANSITIONED";
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
}

export interface DashboardInsights {
  topCategories: TopCategoryItem[];
  queueActivity: QueueActivityItem[];
}

export const QUEUE_ACTIVITY_PAGE_SIZE = 2;
export const QUEUE_ACTIVITY_FETCH_LIMIT = 8;

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): T[] {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageCount(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) {
    return 1;
  }
  return Math.ceil(totalItems / pageSize);
}

export async function fetchTopCategories(
  days = 30,
  limit = 5,
): Promise<TopCategoryItem[]> {
  const response = await apiGet<{ categories: TopCategoryItem[]; days: number }>(
    `/complaints/dashboard/top-categories?days=${days}&limit=${limit}`,
  );
  return response.categories;
}

export async function fetchQueueActivity(
  limit = QUEUE_ACTIVITY_FETCH_LIMIT,
): Promise<QueueActivityItem[]> {
  const response = await apiGet<{ events: QueueActivityItem[] }>(
    `/complaints/dashboard/queue-activity?limit=${limit}`,
  );
  return response.events;
}

export async function fetchDashboardInsights(): Promise<DashboardInsights> {
  const [topCategories, queueActivity] = await Promise.all([
    fetchTopCategories(),
    fetchQueueActivity(),
  ]);
  return { topCategories, queueActivity };
}

export function categoryDisplayName(
  category: TopCategoryItem,
  locale: string,
): string {
  if (locale === "am" && category.nameAm) {
    return category.nameAm;
  }
  return category.nameEn;
}

export function topCategoryMax(categories: TopCategoryItem[]): number {
  return Math.max(...categories.map((item) => item.count), 1);
}

export function formatRelativeTime(
  isoDate: string,
  locale: string,
  now = Date.now(),
): string {
  const then = Date.parse(isoDate);
  if (Number.isNaN(then)) {
    return isoDate;
  }

  const diffSec = Math.round((then - now) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }
  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }
  const diffDay = Math.round(diffSec / 86400);
  return rtf.format(diffDay, "day");
}
