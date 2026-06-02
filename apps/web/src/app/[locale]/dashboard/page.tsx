import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardHomePage() {
  const t = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-on-surface">{t("dashboard")}</h1>
      <Card>
        <EmptyState
          title="Dashboard KPIs"
          description="Volume, SLA, and queue metrics ship in Phase 2 (staff vertical slice)."
        />
      </Card>
    </div>
  );
}
