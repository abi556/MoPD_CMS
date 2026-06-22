import { RequirePermission } from "@/components/auth/require-permission";
import { KnowledgeAdminPanel } from "@/components/staff/admin/knowledge/knowledge-admin-panel";

export default function AdminKnowledgePage() {
  return (
    <RequirePermission permission="knowledge:manage">
      <KnowledgeAdminPanel />
    </RequirePermission>
  );
}
