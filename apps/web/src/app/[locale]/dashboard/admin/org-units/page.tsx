import { RequirePermission } from "@/components/auth/require-permission";
import { OrgUnitsAdminPanel } from "@/components/staff/admin/org-units/org-units-admin-panel";

export default function AdminOrgUnitsPage() {
  return (
    <RequirePermission permission="config:manage">
      <OrgUnitsAdminPanel />
    </RequirePermission>
  );
}
