"use client";

import { useTranslations } from "next-intl";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  KpiStatCard,
  KpiStatCardSkeleton,
} from "@/components/staff/dashboard/kpi-stat-card";
import {
  fetchDashboardKpis,
  type DashboardKpis,
} from "@/lib/staff/complaint-kpis";
import { useCallback, useEffect, useState } from "react";

export function DashboardKpiGrid() {
  const t = useTranslations("staff.dashboard");
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchDashboardKpis();
      setKpis(data);
    } catch {
      setError(true);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiStatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-staff-border bg-staff-surface p-6">
        <p className="text-danger">{t("error")}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (
    kpis &&
    kpis.totalOpen === 0 &&
    kpis.triageQueue === 0 &&
    kpis.qaReview === 0 &&
    kpis.slaAtRisk === 0
  ) {
    return (
      <div className="mb-6">
        <EmptyState title={t("empty")} description="" />
      </div>
    );
  }

  return (
    <PermissionGate match="any" permissions={["complaint:read", "complaint:read:own"]}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label={t("totalOpen")}
          value={kpis?.totalOpen ?? 0}
          variant="primary"
        />
        <KpiStatCard
          label={t("triageQueue")}
          value={kpis?.triageQueue ?? 0}
          variant="secondary"
        />
        <KpiStatCard
          label={t("qaReview")}
          value={kpis?.qaReview ?? 0}
          variant="tertiary"
        />
        <KpiStatCard
          label={t("slaAtRisk")}
          value={kpis?.slaAtRisk ?? 0}
          hint={t("slaTooltip")}
          variant="warning"
        />
      </div>
    </PermissionGate>
  );
}
