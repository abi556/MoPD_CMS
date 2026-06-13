import { RequirePermission } from "@/components/auth/require-permission";
import { TemplatesAdminPanel } from "@/components/staff/admin/templates/templates-admin-panel";

export default function AdminTemplatesPage() {
  return (
    <RequirePermission permission="template:manage">
      <TemplatesAdminPanel />
    </RequirePermission>
  );
}
