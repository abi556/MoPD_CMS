import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsDashboardView } from "@/components/staff/reports/reports-dashboard-view";

export default async function ReportsResolutionPage() {
  const t = await getTranslations("reports.resolution");
  return (
    <RequirePermission permission="report:view">
      <ReportsDashboardView
        kind="resolution"
        title={t("title")}
        subtitle={t("subtitle")}
      />
    </RequirePermission>
  );
}
