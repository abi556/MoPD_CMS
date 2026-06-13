import { RequirePermission } from "@/components/auth/require-permission";
import { RolesAdminPanel } from "@/components/staff/admin/roles/roles-admin-panel";

export default function AdminRolesPage() {
  return (
    <RequirePermission permission="role:manage">
      <RolesAdminPanel />
    </RequirePermission>
  );
}
