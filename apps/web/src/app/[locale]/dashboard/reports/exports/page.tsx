import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsExportsView } from "@/components/staff/reports/reports-exports-view";

export default async function ReportsExportsPage() {
  const t = await getTranslations("reports.exports");
  return (
    <RequirePermission permission="report:export">
      <ReportsExportsView title={t("title")} subtitle={t("subtitle")} />
    </RequirePermission>
  );
}
