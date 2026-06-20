import type { InAppNotificationItem } from "./in-app-notifications-api";

export type InboxDateGroup = "today" | "yesterday" | "earlier";

export function inboxDateGroup(createdAt: string, now = new Date()): InboxDateGroup {
  const date = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  return "earlier";
}

export function groupNotificationsByDate(
  items: InAppNotificationItem[],
  now = new Date(),
): Array<{ group: InboxDateGroup; items: InAppNotificationItem[] }> {
  const order: InboxDateGroup[] = ["today", "yesterday", "earlier"];
  const buckets: Record<InboxDateGroup, InAppNotificationItem[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const item of items) {
    buckets[inboxDateGroup(item.createdAt, now)].push(item);
  }

  return order
    .filter((group) => buckets[group].length > 0)
    .map((group) => ({ group, items: buckets[group] }));
}

export function formatUnreadBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

const INBOX_PARAM_ALIASES: Record<string, string> = {
  referenceNo: "reference",
};

const INBOX_TYPE_REQUIRED_PARAMS: Record<
  string,
  Array<{ key: string; fallback: string | number }>
> = {
  complaintAssigned: [{ key: "reference", fallback: "—" }],
  caseTaskAssigned: [{ key: "title", fallback: "—" }],
  caseTaskReassigned: [{ key: "title", fallback: "—" }],
  slaWarning: [
    { key: "reference", fallback: "—" },
    { key: "thresholdPct", fallback: 0 },
  ],
  slaBreached: [{ key: "reference", fallback: "—" }],
  accountEmailChanged: [{ key: "email", fallback: "—" }],
  reportExportReady: [
    { key: "format", fallback: "—" },
    { key: "rowCount", fallback: 0 },
  ],
  reportExportFailed: [{ key: "format", fallback: "—" }],
};

/** Maps API param aliases and fills missing ICU placeholders for inbox copy. */
export function normalizeInboxMessageParams(
  typeKey: string,
  params: Record<string, unknown> | null | undefined,
): Record<string, string | number> {
  const merged: Record<string, unknown> = { ...(params ?? {}) };

  for (const [alias, target] of Object.entries(INBOX_PARAM_ALIASES)) {
    if (merged[target] == null && merged[alias] != null) {
      merged[target] = merged[alias];
    }
  }

  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === "string" || typeof value === "number") {
      result[key] = value;
    }
  }

  for (const { key, fallback } of INBOX_TYPE_REQUIRED_PARAMS[typeKey] ?? []) {
    if (result[key] == null) {
      result[key] = fallback;
    }
  }

  return result;
}
