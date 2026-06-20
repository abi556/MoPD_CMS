import { RequirePermission } from "@/components/auth/require-permission";
import { NotificationsPanel } from "@/components/staff/notifications/notifications-panel";

export default function AdminNotificationsPage() {
  return (
    <RequirePermission permission="notification:manage">
      <NotificationsPanel />
    </RequirePermission>
  );
}
