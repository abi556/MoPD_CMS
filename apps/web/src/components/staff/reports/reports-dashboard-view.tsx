"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { listCategories } from "@/lib/staff/categories-api";
import { listOrgUnits } from "@/lib/staff/org-units-api";
import type { ReportFilters } from "@/lib/staff/reports-filters";
import {
  getChannelsDashboard,
  getResolutionDashboard,
  getSlaDashboard,
  getVolumeDashboard,
} from "@/lib/staff/reports-api";
import { DashboardFilterBar } from "./dashboard-filter-bar";
import { ReportsEmptyState } from "./reports-empty-state";
import { ReportsErrorState } from "./reports-error-state";
import { KpiStatCard } from "@/components/staff/dashboard/kpi-stat-card";
import { ReportsPageShell } from "./reports-page-shell";
import { ReportsTableFallback } from "./reports-table-fallback";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const VolumeChart = dynamic(() => import("./charts/volume-chart").then((m) => m.VolumeChart), {
  ssr: false,
  loading: () => <LoadingSkeleton className="h-44 w-full" />,
});
const SlaChart = dynamic(() => import("./charts/sla-chart").then((m) => m.SlaChart), {
  ssr: false,
  loading: () => <LoadingSkeleton className="h-32 w-full" />,
});
const ResolutionChart = dynamic(
  () => import("./charts/resolution-chart").then((m) => m.ResolutionChart),
  { ssr: false, loading: () => <LoadingSkeleton className="h-44 w-full" /> },
);
const ChannelsChart = dynamic(
  () => import("./charts/channels-chart").then((m) => m.ChannelsChart),
  { ssr: false, loading: () => <LoadingSkeleton className="h-44 w-full" /> },
);

function defaultFilters(): ReportFilters {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    bucket: "day",
  };
}

export function ReportsDashboardView({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: "volume" | "sla" | "resolution" | "channels";
}) {
  const t = useTranslations("reports");
  const [filters, setFilters] = useState<ReportFilters>(() => defaultFilters());
  const [applied, setApplied] = useState<ReportFilters>(() => defaultFilters());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [orgUnits, setOrgUnits] = useState<Array<{ value: string; label: string }>>([]);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    void Promise.all([listCategories(true), listOrgUnits(true)]).then(
      ([cats, units]) => {
        setCategories(cats.map((c) => ({ value: c.id, label: c.nameEn })));
        setOrgUnits(units.map((u) => ({ value: u.id, label: u.nameEn })));
      },
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      if (kind === "volume") {
        setData(await getVolumeDashboard(applied));
      } else if (kind === "sla") {
        setData(await getSlaDashboard(applied));
      } else if (kind === "resolution") {
        setData(await getResolutionDashboard(applied));
      } else {
        setData(await getChannelsDashboard(applied));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }, [applied, kind, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const body = useMemo(() => {
    if (loading) {
      return <LoadingSkeleton className="h-56 w-full" />;
    }
    if (error) {
      return <ReportsErrorState message={error} />;
    }
    if (!data) {
      return <ReportsEmptyState />;
    }

    if (kind === "volume") {
      const value = data as Awaited<ReturnType<typeof getVolumeDashboard>>;
      if (value.meta.total === 0) return <ReportsEmptyState />;
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiStatCard label={t("kpi.totalComplaints")} value={value.meta.total} variant="primary" />
            <KpiStatCard label={t("kpi.buckets")} value={value.buckets.length} variant="secondary" />
            <KpiStatCard label={t("kpi.statuses")} value={value.series.length} variant="tertiary" />
          </div>
          <VolumeChart buckets={value.buckets} series={value.series} />
          <ReportsTableFallback
            headers={[t("table.status"), ...value.buckets]}
            rows={value.series.map((item) => [item.status, ...item.counts])}
          />
        </div>
      );
    }

    if (kind === "sla") {
      const value = data as Awaited<ReturnType<typeof getSlaDashboard>>;
      if (value.total === 0) return <ReportsEmptyState />;
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiStatCard label={t("kpi.totalTrackers")} value={value.total} variant="primary" />
            <KpiStatCard label={t("kpi.onTimePct")} value={`${value.onTimePct}%`} variant="secondary" />
            <KpiStatCard label={t("kpi.breachedPct")} value={`${value.breachedPct}%`} variant="warning" />
          </div>
          <SlaChart onTimePct={value.onTimePct} breachedPct={value.breachedPct} />
          <ReportsTableFallback
            headers={[t("table.metric"), t("table.value")]}
            rows={[
              [t("table.onTime"), value.onTimeCount],
              [t("table.breached"), value.breachedCount],
              [t("table.active"), value.activeCount],
            ]}
          />
        </div>
      );
    }

    if (kind === "resolution") {
      const value = data as Awaited<ReturnType<typeof getResolutionDashboard>>;
      if (value.createdCount === 0) return <ReportsEmptyState />;
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiStatCard
              label={t("kpi.avgResolutionHours")}
              value={value.avgResolutionHours?.toFixed(1) ?? "—"}
              variant="primary"
            />
            <KpiStatCard
              label={t("kpi.resolutionRate")}
              value={`${value.resolutionRate}%`}
              variant="secondary"
            />
            <KpiStatCard label={t("kpi.backlog")} value={value.backlog} variant="tertiary" />
          </div>
          <ResolutionChart byBucket={value.byBucket} />
          <ReportsTableFallback
            headers={[t("table.bucket"), t("table.avgHours")]}
            rows={value.byBucket.map((item) => [
              item.bucket,
              item.avgResolutionHours?.toFixed(1) ?? "—",
            ])}
          />
        </div>
      );
    }

    const value = data as Awaited<ReturnType<typeof getChannelsDashboard>>;
    if (value.meta.total === 0) return <ReportsEmptyState />;
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <KpiStatCard label={t("kpi.totalComplaints")} value={value.meta.total} variant="primary" />
          <KpiStatCard label={t("kpi.channels")} value={value.channels.length} variant="secondary" />
        </div>
        <ChannelsChart channels={value.channels} />
        <ReportsTableFallback
          headers={[t("table.channel"), t("table.count")]}
          rows={value.channels.map((item) => [item.channel, item.count])}
        />
      </div>
    );
  }, [data, error, kind, loading, t]);

  return (
    <ReportsPageShell
      title={title}
      subtitle={subtitle}
      filterBar={
        <DashboardFilterBar
          filters={filters}
          categories={categories}
          orgUnits={orgUnits}
          submitting={loading}
          onChange={setFilters}
          onApply={() => setApplied(filters)}
          onReset={() => {
            const next = defaultFilters();
            setFilters(next);
            setApplied(next);
          }}
        />
      }
    >
      {body}
    </ReportsPageShell>
  );
}
