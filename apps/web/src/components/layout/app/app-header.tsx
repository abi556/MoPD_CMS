"use client";

import { HelpCircle, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { NotificationBellButton } from "@/components/staff/notifications/notification-bell-button";
import { StaffHeaderBrandMark } from "@/components/staff/layout/staff-header-brand";
import { StaffLocaleSwitcher } from "@/components/staff/layout/staff-locale-switcher";
import { UserAvatarButton } from "@/components/staff/layout/user-menu";
import { StaffHeaderSearch } from "@/components/staff/layout/staff-header-search";
import { useSidebar } from "@/components/staff/layout/sidebar-context";
import { ThemeToggle } from "@/components/staff/theme/theme-toggle";

function AppHeaderInner() {
  const t = useTranslations("nav-staff");
  const tShell = useTranslations("staff.shell");
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-staff-shell-divider bg-staff-header backdrop-blur-md supports-backdrop-filter:bg-staff-header">
      <div className="flex h-15 w-full items-center gap-3 px-4 md:gap-4 md:px-6">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text md:hidden"
          aria-label={t("openMenu")}
        >
          <Menu size={20} aria-hidden />
        </button>

        <StaffHeaderBrandMark />

        <StaffHeaderSearch />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ThemeToggle compact />
          <NotificationBellButton />
          <span className="hidden sm:contents">
            <Link
              href={staffRoutes.help}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/40 focus-visible:ring-offset-2 focus-visible:ring-offset-staff-surface"
              aria-label={tShell("help")}
            >
              <HelpCircle size={17} aria-hidden />
            </Link>
          </span>
          <StaffLocaleSwitcher />
          <UserAvatarButton />
        </div>
      </div>
    </header>
  );
}

export function AppHeader() {
  return <AppHeaderInner />;
}
