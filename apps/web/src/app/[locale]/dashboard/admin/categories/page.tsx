import { RequirePermission } from "@/components/auth/require-permission";
import { CategoriesAdminPanel } from "@/components/staff/admin/categories/categories-admin-panel";

export default function AdminCategoriesPage() {
  return (
    <RequirePermission permission="config:manage">
      <CategoriesAdminPanel />
    </RequirePermission>
  );
}
