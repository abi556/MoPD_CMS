"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { buildAdminNav } from "@/lib/navigation/build-admin-nav";
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
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-staff-nav-active-bg text-staff-nav-active-text shadow-sm"
                : "text-staff-text-muted hover:bg-staff-nav-hover hover:text-staff-text"
            }`}
          >
            {t(item.labelKey as "adminUsers")}
          </Link>
        );
      })}
    </nav>
  );
}
