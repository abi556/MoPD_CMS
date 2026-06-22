"use client";

import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { buildAdminNav } from "@/lib/navigation/build-admin-nav";
import { getStaffSubNavIcon } from "@/lib/navigation/staff-nav-icons";
import { useSession } from "@/components/providers/auth-provider";
import { staffRoutes } from "@/lib/staff/routes";

export function AdminSubNav() {
  const t = useTranslations("nav-staff");
  const pathname = usePathname();
  const { user } = useSession();
  const links = user ? buildAdminNav(user) : [];

  if (pathname === staffRoutes.admin.root || links.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={t("admin")}
      className="mb-4 flex flex-wrap gap-2 border-b border-staff-border pb-3"
    >
      <Link
        href={staffRoutes.admin.root}
        className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text"
      >
        {t("admin")}
      </Link>
      {links.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = getStaffSubNavIcon(item.labelKey) ?? Activity;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-staff-nav-active-bg text-staff-nav-active-text shadow-sm"
                : "text-staff-text-muted hover:bg-staff-nav-hover hover:text-staff-text"
            }`}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            {t(item.labelKey as "adminUsers")}
          </Link>
        );
      })}
    </nav>
  );
}
