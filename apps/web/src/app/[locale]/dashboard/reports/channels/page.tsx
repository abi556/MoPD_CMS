import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsDashboardView } from "@/components/staff/reports/reports-dashboard-view";

export default async function ReportsChannelsPage() {
  const t = await getTranslations("reports.channels");
  return (
    <RequirePermission permission="report:view">
      <ReportsDashboardView
        kind="channels"
        title={t("title")}
        subtitle={t("subtitle")}
      />
    </RequirePermission>
  );
}
