"use client";

import { useTranslations } from "next-intl";
import { DashboardBottomCards } from "@/components/staff/dashboard/dashboard-bottom-cards";
import { DashboardAnalyticsPanel } from "@/components/staff/dashboard/dashboard-analytics-panel";
import { DashboardKpiGrid } from "@/components/staff/dashboard/dashboard-kpi-grid";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { DashboardTabs } from "@/components/staff/dashboard/dashboard-tabs";

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
