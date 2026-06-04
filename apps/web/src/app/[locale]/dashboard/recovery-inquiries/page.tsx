import { setRequestLocale } from "next-intl/server";
import { RecoveryInquiriesPanel } from "@/components/dashboard/RecoveryInquiriesPanel";

export default async function RecoveryInquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="p-6 md:p-8">
      <RecoveryInquiriesPanel />
    </div>
  );
}
