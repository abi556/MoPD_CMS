/** Placeholder analytics until GET /reports/dashboard/* ships (SDS §5.3.9). */

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

export const MOCK_DASHBOARD_ANALYTICS: DashboardAnalyticsSnapshot = {
  statusMix: [
    { id: "submitted", value: 42, color: "var(--staff-chart-submitted)" },
    { id: "open", value: 28, color: "var(--staff-chart-open)" },
    { id: "inReview", value: 18, color: "var(--staff-chart-review)" },
    { id: "resolved", value: 64, color: "var(--staff-chart-resolved)" },
    { id: "closed", value: 51, color: "var(--staff-chart-closed)" },
  ],
  weeklyVolume: [
    { label: "W1", submitted: 18, closed: 12 },
    { label: "W2", submitted: 24, closed: 16 },
    { label: "W3", submitted: 21, closed: 19 },
    { label: "W4", submitted: 30, closed: 22 },
    { label: "W5", submitted: 26, closed: 28 },
    { label: "W6", submitted: 32, closed: 25 },
  ],
  slaOnTimePercent: 87,
  channels: [
    { id: "web", value: 48, color: "var(--staff-chart-channel-web)" },
    { id: "email", value: 22, color: "var(--staff-chart-channel-email)" },
    { id: "sms", value: 18, color: "var(--staff-chart-channel-sms)" },
    { id: "walkIn", value: 12, color: "var(--staff-chart-channel-walkin)" },
  ],
};

export function statusMixTotal(segments: StatusSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}

export function channelMax(channels: ChannelShare[]): number {
  return Math.max(...channels.map((channel) => channel.value), 1);
}

/** Resolves when report APIs are available (RPT-02–05). */
export async function fetchDashboardAnalytics(): Promise<DashboardAnalyticsSnapshot> {
  return MOCK_DASHBOARD_ANALYTICS;
}
