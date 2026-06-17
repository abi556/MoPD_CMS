import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsDashboardView } from "@/components/staff/reports/reports-dashboard-view";

export default async function ReportsVolumePage() {
  const t = await getTranslations("reports.volume");
  return (
    <RequirePermission permission="report:view">
      <ReportsDashboardView kind="volume" title={t("title")} subtitle={t("subtitle")} />
    </RequirePermission>
  );
}
