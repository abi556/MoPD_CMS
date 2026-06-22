"use client";

import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildAdminNav } from "@/lib/navigation/build-admin-nav";
import { ADMIN_NAV_ICONS } from "@/lib/navigation/staff-nav-icons";
import { hasExactPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { StaffHubCard } from "@/components/staff/ui/staff-hub-card";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";

const ADMIN_ICONS = ADMIN_NAV_ICONS;

const ADMIN_DESCRIPTION_KEYS: Record<string, string> = {
  adminUsers: "users.subtitle",
  adminRoles: "roles.subtitle",
  adminCategories: "categories.subtitle",
  adminOrgUnits: "orgUnits.subtitle",
  adminSla: "sla.subtitle",
  adminTemplates: "templates.subtitle",
  adminKnowledge: "knowledge.subtitle",
  adminSystem: "system.subtitle",
  adminAudit: "audit.subtitle",
};

export default function DashboardAdminPage() {
  const tNav = useTranslations("nav-staff");
  const tAdmin = useTranslations("admin");
  const { user } = useSession();
  const adminLinks = user ? buildAdminNav(user) : [];
  const hubLinks =
    user &&
    hasExactPermission(user.permissions, "knowledge:manage") &&
    !adminLinks.some((item) => item.href === staffRoutes.admin.knowledge)
      ? [
          ...adminLinks,
          {
            href: staffRoutes.admin.knowledge,
            labelKey: "adminKnowledge",
          },
        ]
      : adminLinks;

  return (
    <StaffPageShell title={tNav("admin")} subtitle={tAdmin("hub.subtitle")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hubLinks.map((item) => {
          const labelKey = item.labelKey as keyof typeof ADMIN_ICONS;
          const Icon = ADMIN_ICONS[labelKey] ?? Activity;
          const descriptionKey = ADMIN_DESCRIPTION_KEYS[labelKey];
          const description = descriptionKey
            ? tAdmin(descriptionKey as "users.subtitle")
            : "";

          return (
            <StaffHubCard
              key={item.href}
              href={item.href}
              icon={Icon}
              title={tNav(labelKey as "adminUsers")}
              description={description}
            />
          );
        })}
      </div>
    </StaffPageShell>
  );
}
