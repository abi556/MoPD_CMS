import { setRequestLocale } from "next-intl/server";
import { RequirePermission } from "@/components/auth/require-permission";
import { RecoveryInquiriesPanel } from "@/components/staff/recovery/recovery-inquiries-panel";

export default async function RecoveryInquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RequirePermission permission="complaint:recovery:manage">
      <RecoveryInquiriesPanel />
    </RequirePermission>
  );
}
