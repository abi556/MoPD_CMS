"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  getChannelsDashboard,
  getResolutionDashboard,
  getSlaDashboard,
  getVolumeDashboard,
} from "@/lib/staff/reports-api";
import { KpiStatCard } from "@/components/staff/dashboard/kpi-stat-card";
import { ReportsEmptyState } from "@/components/staff/reports/reports-empty-state";
import { ReportsErrorState } from "@/components/staff/reports/reports-error-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { StaffSurfaceCard } from "@/components/staff/ui/staff-surface-card";
import { StaffAlert } from "@/components/staff/ui/staff-alert";

const VolumeChart = dynamic(
  () => import("./charts/volume-chart").then((m) => m.VolumeChart),
  { ssr: false, loading: () => <LoadingSkeleton className="h-44 w-full" /> },
);
const ChannelsChart = dynamic(
  () => import("./charts/channels-chart").then((m) => m.ChannelsChart),
  { ssr: false, loading: () => <LoadingSkeleton className="h-44 w-full" /> },
);
const SlaChart = dynamic(
  () => import("./charts/sla-chart").then((m) => m.SlaChart),
  { ssr: false, loading: () => <LoadingSkeleton className="h-32 w-full" /> },
);
const ResolutionChart = dynamic(
  () => import("./charts/resolution-chart").then((m) => m.ResolutionChart),
  { ssr: false, loading: () => <LoadingSkeleton className="h-44 w-full" /> },
);

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function IntakeHeatmap({
  buckets,
  submitted,
}: {
  buckets: string[];
  submitted: number[];
}) {
  const max = Math.max(...submitted, 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {buckets.map((bucket, idx) => {
          const value = submitted[idx] ?? 0;
          const intensity = clamp01(value / max);
          return (
            <div key={bucket} className="flex flex-col items-center gap-1">
              <div
                className="h-7 w-7 rounded-md border border-staff-border bg-staff-surface"
                style={{
                  backgroundColor: `rgba(47, 107, 59, ${0.08 + intensity * 0.45})`,
                }}
                title={`${bucket}: ${value}`}
                aria-label={`${bucket}: ${value}`}
              />
              <span className="text-[10px] text-staff-text-muted">
                {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                  new Date(bucket),
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-staff-text-muted">{`Max/day: ${max}`}</p>
    </div>
  );
}

export function ExecutiveInsightsView() {
  const t = useTranslations("reports");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [volume, setVolume] = useState<Awaited<ReturnType<typeof getVolumeDashboard>>>();
  const [sla, setSla] = useState<Awaited<ReturnType<typeof getSlaDashboard>>>();
  const [resolution, setResolution] =
    useState<Awaited<ReturnType<typeof getResolutionDashboard>>>();
  const [channels, setChannels] = useState<Awaited<ReturnType<typeof getChannelsDashboard>>>();

  useEffect(() => {
    const filters = {
      from: isoDate(-29),
      to: isoDate(0),
      bucket: "day" as const,
    };

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const [v, s, r, c] = await Promise.all([
          getVolumeDashboard(filters),
          getSlaDashboard(filters),
          getResolutionDashboard(filters),
          getChannelsDashboard(filters),
        ]);
        if (!cancelled) {
          setVolume(v);
          setSla(s);
          setResolution(r);
          setChannels(c);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t("error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const summary = useMemo(() => {
    const total = volume?.meta.total ?? 0;
    const lastIndex = Math.max((volume?.buckets.length ?? 1) - 1, 0);
    const submittedToday = volume?.events.submitted?.[lastIndex] ?? 0;
    const closedToday = volume?.events.closed?.[lastIndex] ?? 0;
    const backlog = resolution?.backlog ?? 0;
    const breachedPct = sla?.breachedPct ?? 0;

    return { total, submittedToday, closedToday, backlog, breachedPct };
  }, [resolution?.backlog, sla?.breachedPct, volume?.buckets.length, volume?.events, volume?.meta]);

  if (loading) {
    return <LoadingSkeleton className="h-64 w-full" />;
  }
  if (error) {
    return <ReportsErrorState message={error} />;
  }
  if (!volume || !sla || !resolution || !channels) {
    return <ReportsEmptyState />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiStatCard label={t("kpi.totalComplaints")} value={summary.total} variant="primary" />
        <KpiStatCard label={t("executive.submittedToday")} value={summary.submittedToday} variant="secondary" />
        <KpiStatCard label={t("executive.closedToday")} value={summary.closedToday} variant="tertiary" />
        <KpiStatCard label={t("kpi.backlog")} value={summary.backlog} variant="warning" />
        <KpiStatCard label={t("kpi.breachedPct")} value={`${summary.breachedPct}%`} variant="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaffSurfaceCard title={t("executive.intakeClosureTitle")} subtitle={t("executive.intakeClosureSubtitle")}>
          <VolumeChart buckets={volume.buckets} series={volume.series} />
          <StaffAlert variant="info">{t("executive.intakeClosureNote")}</StaffAlert>
        </StaffSurfaceCard>

        <StaffSurfaceCard title={t("executive.intakeHeatmapTitle")} subtitle={t("executive.intakeHeatmapSubtitle")}>
          <IntakeHeatmap buckets={volume.buckets.slice(-14)} submitted={volume.events.submitted.slice(-14)} />
        </StaffSurfaceCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaffSurfaceCard title={t("executive.slaTitle")} subtitle={t("executive.slaSubtitle")}>
          <SlaChart onTimePct={sla.onTimePct} breachedPct={sla.breachedPct} />
        </StaffSurfaceCard>

        <StaffSurfaceCard title={t("executive.channelsTitle")} subtitle={t("executive.channelsSubtitle")}>
          <ChannelsChart channels={channels.channels} />
        </StaffSurfaceCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaffSurfaceCard title={t("executive.resolutionTitle")} subtitle={t("executive.resolutionSubtitle")}>
          <ResolutionChart byBucket={resolution.byBucket} />
        </StaffSurfaceCard>

        <StaffSurfaceCard title={t("executive.platformTitle")} subtitle={t("executive.platformSubtitle")}>
          <StaffAlert variant="info">{t("executive.platformNotAvailable")}</StaffAlert>
        </StaffSurfaceCard>
      </div>
    </div>
  );
}

