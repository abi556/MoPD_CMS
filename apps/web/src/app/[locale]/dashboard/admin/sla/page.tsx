import { RequirePermission } from "@/components/auth/require-permission";
import { SlaAdminPanel } from "@/components/staff/admin/sla/sla-admin-panel";

export default function AdminSlaPage() {
  return (
    <RequirePermission permission="sla:configure">
      <SlaAdminPanel />
    </RequirePermission>
  );
}
