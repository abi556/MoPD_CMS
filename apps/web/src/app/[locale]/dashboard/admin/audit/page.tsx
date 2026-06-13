import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { AdminStubPage } from "../admin-stub-page";

export default async function AdminAuditPage() {
  const t = await getTranslations("nav-staff");
  return (
    <RequirePermission permission="audit:read">
      <AdminStubPage
        title={t("adminAudit")}
        description="Audit log viewer ships in Sprint 5."
      />
    </RequirePermission>
  );
}
