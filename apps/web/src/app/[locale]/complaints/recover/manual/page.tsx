import { setRequestLocale } from "next-intl/server";
import { ComplaintRecoverManualPanel } from "@/components/complaints/recover/ComplaintRecoverManualPanel";
import { PublicShell } from "@/components/layout/public-shell";

export default async function ComplaintRecoverManualPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PublicShell>
      <ComplaintRecoverManualPanel />
    </PublicShell>
  );
}
