import {
  getChannelsDashboard,
  getSlaDashboard,
  getVolumeDashboard,
  type ChannelsDashboardResponse,
  type VolumeDashboardResponse,
} from "./reports-api";

export interface StatusSegment {
  id: string;
  value: number;
  color: string;
}

export interface WeeklyVolume {
  label: string;
  submitted: number;
  closed: number;
}

export interface ChannelShare {
  id: string;
  value: number;
  color: string;
}

export interface DashboardAnalyticsSnapshot {
  statusMix: StatusSegment[];
  weeklyVolume: WeeklyVolume[];
  slaOnTimePercent: number;
  channels: ChannelShare[];
}

const STATUS_IDS = ["submitted", "open", "inReview", "resolved", "closed"] as const;
type StatusId = (typeof STATUS_IDS)[number];

const CHANNEL_IDS = ["web", "email", "telegram", "walkIn"] as const;
type ChannelId = (typeof CHANNEL_IDS)[number];

const STATUS_COLORS: Record<StatusId, string> = {
  submitted: "var(--staff-chart-submitted)",
  open: "var(--staff-chart-open)",
  inReview: "var(--staff-chart-review)",
  resolved: "var(--staff-chart-resolved)",
  closed: "var(--staff-chart-closed)",
};

const CHANNEL_COLORS: Record<ChannelId, string> = {
  web: "var(--staff-chart-channel-web)",
  email: "var(--staff-chart-channel-email)",
  telegram: "var(--staff-chart-channel-sms)",
  walkIn: "var(--staff-chart-channel-walkin)",
};

const STATUS_GROUPS: Record<StatusId, string[]> = {
  submitted: ["SUBMITTED"],
  open: ["TRIAGE", "ASSIGNED", "IN_INVESTIGATION"],
  inReview: ["DRAFT_RESPONSE", "QA_LEGAL_REVIEW", "AWAITING_FEEDBACK", "APPEAL"],
  resolved: ["RESPONSE_ISSUED"],
  closed: ["CLOSED"],
};

const CHANNEL_GROUPS: Record<ChannelId, string[]> = {
  web: ["WEB"],
  email: ["EMAIL"],
  telegram: ["TELEGRAM", "SMS"],
  walkIn: ["ASSISTED", "USSD"],
};

function isoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sumSeries(series: VolumeDashboardResponse["series"], statuses: string[]): number {
  return series
    .filter((item) => statuses.includes(item.status))
    .reduce(
      (sum, item) => sum + item.counts.reduce((bucketSum, count) => bucketSum + count, 0),
      0,
    );
}

function bucketTimestamp(bucket: string): number {
  const parsed = Date.parse(bucket);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function toDisplayLabel(bucket: string): string {
  const parsed = Date.parse(bucket);
  if (Number.isNaN(parsed)) {
    return bucket;
  }
  const formatted = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(parsed));
  return formatted;
}

function normalizeVolumeBuckets(volume: VolumeDashboardResponse): VolumeDashboardResponse {
  const ordered = volume.buckets
    .map((bucket, index) => ({ bucket, index }))
    .sort((a, b) => bucketTimestamp(a.bucket) - bucketTimestamp(b.bucket));
  const orderedBuckets = ordered.map((item) => item.bucket);
  const orderedIndexes = ordered.map((item) => item.index);

  return {
    ...volume,
    buckets: orderedBuckets,
    series: volume.series.map((item) => ({
      ...item,
      counts: orderedIndexes.map((index) => item.counts[index] ?? 0),
    })),
  };
}

function countByChannel(
  channels: ChannelsDashboardResponse["channels"],
  channelCodes: string[],
): number {
  return channels
    .filter((item) => channelCodes.includes(item.channel))
    .reduce((sum, item) => sum + item.count, 0);
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function buildWeeklyVolume(
  buckets: string[],
  events: VolumeDashboardResponse["events"],
): WeeklyVolume[] {
  const submittedSeries = events.submitted ?? [];
  const closedSeries = events.closed ?? [];

  return buckets.map((bucket, index) => {
    const submitted = submittedSeries[index] ?? 0;
    const closed = closedSeries[index] ?? 0;
    return {
      label: toDisplayLabel(bucket),
      submitted,
      closed,
    };
  });
}

export function statusMixTotal(segments: StatusSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}

export function channelMax(channels: ChannelShare[]): number {
  return Math.max(...channels.map((channel) => channel.value), 1);
}

export const VOLUME_CHART_WINDOW_DAYS = 7;

export function volumeWindowCount(dataLength: number): number {
  if (dataLength <= 0) {
    return 1;
  }
  return Math.ceil(dataLength / VOLUME_CHART_WINDOW_DAYS);
}

/** windowIndex 0 = most recent 7 days, 1 = previous 7 days, etc. */
export function volumeWindowSlice(
  data: WeeklyVolume[],
  windowIndex: number,
): WeeklyVolume[] {
  if (data.length === 0) {
    return [];
  }

  const totalWindows = volumeWindowCount(data.length);
  const clampedIndex = Math.min(Math.max(windowIndex, 0), totalWindows - 1);
  const end = data.length - clampedIndex * VOLUME_CHART_WINDOW_DAYS;
  const start = Math.max(0, end - VOLUME_CHART_WINDOW_DAYS);
  return data.slice(start, end);
}

export function volumeWindowRangeLabel(data: WeeklyVolume[]): string {
  if (data.length === 0) {
    return "";
  }
  if (data.length === 1) {
    return data[0].label;
  }
  return `${data[0].label} – ${data[data.length - 1].label}`;
}

export async function fetchDashboardAnalytics(): Promise<DashboardAnalyticsSnapshot> {
  const filters = {
    from: isoDate(-13),
    to: isoDate(0),
    bucket: "day" as const,
  };

  const [rawVolume, sla, channels] = await Promise.all([
    getVolumeDashboard(filters),
    getSlaDashboard(filters),
    getChannelsDashboard(filters),
  ]);
  const volume = normalizeVolumeBuckets(rawVolume);

  const statusMix: StatusSegment[] = STATUS_IDS.map((id) => ({
    id,
    value: sumSeries(volume.series, STATUS_GROUPS[id]),
    color: STATUS_COLORS[id],
  }));

  const channelTotal = channels.meta.total ?? 0;
  const channelShares: ChannelShare[] = CHANNEL_IDS.map((id) => {
    const count = countByChannel(channels.channels, CHANNEL_GROUPS[id]);
    return {
      id,
      value: toPercent(count, channelTotal),
      color: CHANNEL_COLORS[id],
    };
  });

  return {
    statusMix,
    weeklyVolume: buildWeeklyVolume(volume.buckets, volume.events),
    slaOnTimePercent: Math.round(sla.onTimePct),
    channels: channelShares,
  };
}
