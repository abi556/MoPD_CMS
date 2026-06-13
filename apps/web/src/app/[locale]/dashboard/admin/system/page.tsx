import { RequirePermission } from "@/components/auth/require-permission";
import { SystemHealthPanel } from "@/components/staff/admin/system/system-health-panel";

export default function AdminSystemPage() {
  return (
    <RequirePermission permission="admin:ping">
      <SystemHealthPanel />
    </RequirePermission>
  );
}
