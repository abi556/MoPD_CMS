import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicShell } from "@/components/layout/public-shell";

export default async function ComplaintNewPage() {
  const t = await getTranslations("public");

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title={t("ctaSubmit")}
          description="Complaint submission wizard ships in Phase 3 (public portal)."
        />
      </div>
    </PublicShell>
  );
}
