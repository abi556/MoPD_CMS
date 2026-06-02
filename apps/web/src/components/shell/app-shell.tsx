"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Settings,
  Menu,
  Search,
  Bell,
  HelpCircle,
  LogOut
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { buildAppNav } from "@/lib/navigation/build-app-nav";
import { useSession } from "@/components/providers/auth-provider";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  inbox: Inbox,
  "bar-chart-3": BarChart3,
  settings: Settings,
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const commonT = useTranslations("common");
  const { user, logout } = useSession();
  const navItems = user ? buildAppNav(user) : [];
  const pathname = usePathname();

  return (
    <div className="bg-bg-app-shell text-on-surface min-h-screen flex font-body antialiased">
      {/* SideNavBar */}
      <nav className="bg-surface dark:bg-on-background h-screen w-sidebar-wide border-r border-border-standard fixed left-0 top-0 z-20 hidden md:flex flex-col">
        <div className="p-gutter border-b border-border-standard">
          <div className="font-h3 text-h3 text-primary dark:text-inverse-primary mb-1">
            {commonT("appName")}
          </div>
          <div className="font-label text-label text-text-secondary">Staff Console</div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 transition-all duration-200 ease-in-out border-l-4 ${
                  isActive
                    ? "text-primary dark:text-inverse-primary font-bold border-primary bg-brand-surface dark:bg-tertiary-container"
                    : "text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low border-transparent"
                }`}
              >
                <Icon className="mr-3" size={20} strokeWidth={1.75} aria-hidden="true" />
                <span className="font-body text-body">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-sidebar-wide w-full md:w-[calc(100%-256px)] min-h-screen relative">
        {/* TopNavBar */}
        <header className="bg-surface dark:bg-on-background w-full top-0 z-10 flex justify-between items-center h-16 px-gutter border-b border-border-standard sticky">
          <div className="flex items-center">
            {/* Mobile Menu Toggle (Visible only on mobile) */}
            <button className="md:hidden mr-4 text-on-surface-variant hover:text-primary transition-colors">
              <Menu size={24} />
            </button>
            <div className="font-h2 text-h2 text-primary dark:text-inverse-primary font-bold hidden sm:block">
              Staff Console
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder" size={20} />
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-border-standard rounded-lg font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all"
                placeholder="Search..."
                type="text"
              />
            </div>
            <div className="flex gap-2 items-center">
              <LocaleSwitcher />
              <button className="p-2 text-on-surface-variant hover:text-primary transition-opacity active:opacity-70 rounded-full hover:bg-surface-container-low">
                <Bell size={20} />
              </button>
              <button className="p-2 text-on-surface-variant hover:text-primary transition-opacity active:opacity-70 rounded-full hover:bg-surface-container-low">
                <HelpCircle size={20} />
              </button>
              <button 
                onClick={() => logout()}
                className="p-2 text-on-surface-variant hover:text-danger transition-opacity active:opacity-70 rounded-full hover:bg-error-container ml-2"
                title={t("logout")}
              >
                <LogOut size={20} />
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-label text-label cursor-pointer overflow-hidden border border-border-standard ml-2">
              <span className="uppercase">{user?.email?.charAt(0) || "U"}</span>
            </div>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-margin-mobile md:p-gutter max-w-max-width mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-inverse-surface dark:bg-surface-container-lowest w-full bottom-0 flex flex-col md:flex-row justify-between items-center py-4 px-gutter border-t border-border-standard mt-auto gap-4">
          <div className="font-label text-label text-inverse-on-surface dark:text-on-surface text-center md:text-left">
            © 2026 Ministry of Planning and Development. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link className="font-label text-label text-surface-variant hover:text-primary-fixed-dim underline transition-colors" href="/forbidden">Privacy Policy</Link>
            <Link className="font-label text-label text-surface-variant hover:text-primary-fixed-dim underline transition-colors" href="/forbidden">Terms of Service</Link>
            <Link className="font-label text-label text-surface-variant hover:text-primary-fixed-dim underline transition-colors" href="/forbidden">Contact Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
