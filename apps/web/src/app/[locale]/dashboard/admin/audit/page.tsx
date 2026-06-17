import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { AuditExplorerView } from "@/components/staff/audit/audit-explorer-view";

export default async function AdminAuditPage() {
  await getTranslations("nav-staff");
  return (
    <RequirePermission permission="audit:read">
      <AuditExplorerView />
    </RequirePermission>
  );
}
