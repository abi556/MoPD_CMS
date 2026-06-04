import { setRequestLocale } from "next-intl/server";
import { ComplaintTrackPanel } from "@/components/complaints/track/ComplaintTrackPanel";
import { PublicShell } from "@/components/layout/public-shell";

export default async function ComplaintTrackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PublicShell>
      <ComplaintTrackPanel />
    </PublicShell>
  );
}
