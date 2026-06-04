import { setRequestLocale } from "next-intl/server";
import { ComplaintRecoverPanel } from "@/components/complaints/recover/ComplaintRecoverPanel";
import { PublicShell } from "@/components/layout/public-shell";

export default async function ComplaintRecoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PublicShell>
      <ComplaintRecoverPanel />
    </PublicShell>
  );
}
