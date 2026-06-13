"use client";

import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserAvatarButton } from "@/components/staff/layout/user-menu";
import { useSidebar } from "@/components/staff/layout/sidebar-context";
import { ThemeToggle } from "@/components/staff/theme/theme-toggle";

function AppHeaderInner() {
  const t = useTranslations("nav-staff");
  const tShell = useTranslations("staff.shell");
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-4 border-b border-staff-border bg-staff-surface px-4 md:px-6">
      <div className="flex min-w-0 items-center">
        <button
          type="button"
          onClick={toggle}
          className="mr-3 text-staff-text-muted transition-colors hover:text-staff-nav-active md:hidden"
          aria-label={t("openMenu")}
        >
          <Menu size={24} aria-hidden />
        </button>
      </div>

      <div className="relative hidden flex-1 justify-center lg:flex">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-staff-text-muted"
          size={18}
          aria-hidden
        />
        <input
          className="w-full max-w-md rounded-lg border border-staff-border bg-staff-input-bg py-2 pl-10 pr-4 font-body-sm text-body-sm text-staff-text transition-all placeholder:text-staff-text-muted focus:border-staff-nav-active focus:outline-none focus:ring-1 focus:ring-staff-nav-active"
          placeholder={tShell("searchPlaceholder")}
          type="search"
          aria-label={tShell("searchPlaceholder")}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <ThemeToggle />
        <LocaleSwitcher />
        <button
          type="button"
          className="rounded-lg p-2 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text"
          aria-label={tShell("notifications")}
        >
          <Bell size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="hidden rounded-lg p-2 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text sm:block"
          aria-label={tShell("help")}
        >
          <HelpCircle size={18} aria-hidden />
        </button>
        <UserAvatarButton />
      </div>
    </header>
  );
}

export function AppHeader() {
  return <AppHeaderInner />;
}
