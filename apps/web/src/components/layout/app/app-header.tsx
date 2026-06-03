"use client";

import { Bell, HelpCircle, LogOut, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useSession } from "@/components/providers/auth-provider";

export function AppHeader() {
  const t = useTranslations("nav");
  const { user, logout } = useSession();

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border-standard bg-surface px-gutter dark:bg-on-background">
      <div className="flex items-center">
        <button
          type="button"
          className="mr-4 text-on-surface-variant transition-colors hover:text-primary md:hidden"
          aria-label="Open menu"
        >
          <Menu size={24} aria-hidden />
        </button>
        <div className="hidden font-h2 text-h2 font-bold text-primary dark:text-inverse-primary sm:block">
          Staff Console
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder"
            size={20}
            aria-hidden
          />
          <input
            className="w-64 rounded-lg border border-border-standard bg-surface-container-low py-2 pl-10 pr-4 font-body-sm text-body-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search..."
            type="search"
            aria-label="Search"
          />
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low hover:text-primary active:opacity-70"
            aria-label="Notifications"
          >
            <Bell size={20} aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low hover:text-primary active:opacity-70"
            aria-label="Help"
          >
            <HelpCircle size={20} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="ml-2 rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-error-container hover:text-danger active:opacity-70"
            title={t("logout")}
            aria-label={t("logout")}
          >
            <LogOut size={20} aria-hidden />
          </button>
        </div>
        <div className="ml-2 flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border-standard bg-primary-container font-label text-label text-on-primary-container">
          <span className="uppercase">{user?.email?.charAt(0) ?? "U"}</span>
        </div>
      </div>
    </header>
  );
}
