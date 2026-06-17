import { RequirePermission } from "@/components/auth/require-permission";
import { ReportsHub } from "@/components/staff/reports/reports-hub";

export default function DashboardReportsPage() {
  return (
    <RequirePermission permission="report:view">
      <ReportsHub />
    </RequirePermission>
  );
}

