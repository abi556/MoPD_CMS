"use client";

import { useTranslations } from "next-intl";
import { DashboardAnalyticsPanel } from "@/components/staff/dashboard/dashboard-analytics-panel";
import { DashboardKpiGrid } from "@/components/staff/dashboard/dashboard-kpi-grid";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { DashboardTabs } from "@/components/staff/dashboard/dashboard-tabs";

function DashboardBottomCards() {
  const t = useTranslations("staff.dashboard");

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
        <h3 className="font-semibold text-staff-text">{t("topCategories")}</h3>
        <p className="mt-1 text-sm text-staff-text-muted">{t("topCategoriesHint")}</p>
      </div>
      <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
        <h3 className="font-semibold text-staff-text">{t("recentQueue")}</h3>
        <p className="mt-1 text-sm text-staff-text-muted">{t("recentQueueHint")}</p>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const t = useTranslations("staff.dashboard");

  return (
    <>
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />
      <DashboardKpiGrid />
      <DashboardTabs />
      <DashboardAnalyticsPanel />
      <DashboardBottomCards />
    </>
  );
}
