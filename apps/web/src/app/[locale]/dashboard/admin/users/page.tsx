import { RequirePermission } from "@/components/auth/require-permission";
import { UsersAdminPanel } from "@/components/staff/admin/users/users-admin-panel";

export default function AdminUsersPage() {
  return (
    <RequirePermission permission="user:manage">
      <UsersAdminPanel />
    </RequirePermission>
  );
}
