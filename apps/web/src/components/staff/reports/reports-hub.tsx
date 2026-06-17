import {
  BarChart3,
  Clock,
  Download,
  LineChart,
  PieChart,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { staffRoutes } from "@/lib/staff/routes";
import { StaffHubCard } from "@/components/staff/ui/staff-hub-card";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";

const HUB_CARDS = [
  {
    href: staffRoutes.reports.executive,
    icon: Sparkles,
    titleKey: "hub.executiveTitle",
    descriptionKey: "hub.executiveDescription",
  },
  {
    href: staffRoutes.reports.volume,
    icon: BarChart3,
    titleKey: "hub.volumeTitle",
    descriptionKey: "hub.volumeDescription",
  },
  {
    href: staffRoutes.reports.sla,
    icon: Clock,
    titleKey: "hub.slaTitle",
    descriptionKey: "hub.slaDescription",
  },
  {
    href: staffRoutes.reports.resolution,
    icon: LineChart,
    titleKey: "hub.resolutionTitle",
    descriptionKey: "hub.resolutionDescription",
  },
  {
    href: staffRoutes.reports.channels,
    icon: PieChart,
    titleKey: "hub.channelsTitle",
    descriptionKey: "hub.channelsDescription",
  },
  {
    href: staffRoutes.reports.exports,
    icon: Download,
    titleKey: "hub.exportsTitle",
    descriptionKey: "hub.exportsDescription",
  },
] as const;

export function ReportsHub() {
  const t = useTranslations("reports");

  return (
    <StaffPageShell title={t("hub.title")} subtitle={t("hub.subtitle")}>
      <div className="grid gap-4 md:grid-cols-2">
        {HUB_CARDS.map((card) => (
          <StaffHubCard
            key={card.href}
            href={card.href}
            icon={card.icon}
            title={t(card.titleKey)}
            description={t(card.descriptionKey)}
          />
        ))}
      </div>
    </StaffPageShell>
  );
}
