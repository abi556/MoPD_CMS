import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsDashboardView } from "@/components/staff/reports/reports-dashboard-view";

export default async function ReportsSlaPage() {
  const t = await getTranslations("reports.sla");
  return (
    <RequirePermission permission="report:view">
      <ReportsDashboardView kind="sla" title={t("title")} subtitle={t("subtitle")} />
    </RequirePermission>
  );
}
