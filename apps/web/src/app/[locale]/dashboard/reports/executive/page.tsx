import { RequirePermission } from "@/components/auth/require-permission";
import { getTranslations } from "next-intl/server";
import { ReportsPageShell } from "@/components/staff/reports/reports-page-shell";
import { ExecutiveInsightsView } from "@/components/staff/reports/executive-insights-view";

export default async function ExecutiveInsightsPage() {
  const t = await getTranslations("reports");

  return (
    <RequirePermission permission="report:view">
      <ReportsPageShell
        title={t("executive.title")}
        subtitle={t("executive.subtitle")}
      >
        <ExecutiveInsightsView />
      </ReportsPageShell>
    </RequirePermission>
  );
}

