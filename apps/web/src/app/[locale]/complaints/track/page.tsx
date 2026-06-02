import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicShell } from "@/components/layout/public-shell";

export default async function ComplaintTrackPage() {
  const t = await getTranslations("public");

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title={t("ctaTrack")}
          description="Track-by-reference page ships in Phase 3 (public portal)."
        />
      </div>
    </PublicShell>
  );
}
