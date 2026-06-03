"use client";

import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { buildAppNav } from "@/lib/navigation/build-app-nav";
import { useSession } from "@/components/providers/auth-provider";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  inbox: Inbox,
  "bar-chart-3": BarChart3,
  settings: Settings,
} as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const { user } = useSession();
  const navItems = user ? buildAppNav(user) : [];
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-0 top-0 z-20 hidden h-screen w-sidebar-wide flex-col border-r border-border-standard bg-surface md:flex dark:bg-on-background"
      aria-label="Staff navigation"
    >
      <div className="border-b border-border-standard p-gutter">
        <div className="mb-1 font-h3 text-h3 text-primary dark:text-inverse-primary">
          <BrandWordmark suffix=" CMS" />
        </div>
        <div className="font-label text-label text-text-secondary">
          Staff Console
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex cursor-pointer items-center border-l-4 px-4 py-3 transition-all duration-200 ease-in-out ${
                isActive
                  ? "border-primary bg-brand-surface font-bold text-primary dark:bg-tertiary-container dark:text-inverse-primary"
                  : "border-transparent text-on-surface-variant hover:bg-surface-container-low dark:text-outline-variant"
              }`}
            >
              <Icon
                className="mr-3"
                size={20}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="font-body text-body">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
