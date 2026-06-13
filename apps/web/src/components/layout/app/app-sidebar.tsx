"use client";

import {
  BarChart3,
  Bell,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  LogOut,
  MailQuestion,
  Settings,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { buildAppNav } from "@/lib/navigation/build-app-nav";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { useSidebar } from "@/components/staff/layout/sidebar-context";
import type { AppNavItem, AppNavLink } from "@/lib/navigation/build-app-nav";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  inbox: Inbox,
  "mail-question": MailQuestion,
  "bar-chart-3": BarChart3,
  settings: Settings,
  user: User,
  bell: Bell,
} as const;

function isLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === staffRoutes.home) return false;
  return pathname.startsWith(`${href}/`);
}

function navLinkClass(isActive: boolean, depth = 0) {
  const base =
    depth > 0
      ? "flex items-center rounded-xl py-2 pl-9 pr-3 text-[13px] transition-colors duration-200"
      : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200";
  return isActive
    ? `${base} cursor-pointer bg-staff-nav-active-bg font-medium text-staff-nav-active-text shadow-sm`
    : `${base} cursor-pointer text-staff-text-muted hover:bg-staff-nav-hover hover:text-staff-text`;
}

function SubNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AppNavLink;
  pathname: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav-staff");
  const isActive = isLinkActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={navLinkClass(isActive, 1)}
    >
      {t(item.labelKey as "dashboard")}
    </Link>
  );
}

function GroupedNavSection({
  item,
  pathname,
  onNavigate,
}: {
  item: AppNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav-staff");
  const Icon = iconMap[item.icon];
  const sectionActive =
    isLinkActive(pathname, item.href) ||
    (item.groups?.some((group) =>
      group.items.some((link) => isLinkActive(pathname, link.href)),
    ) ??
      false);
  const [expanded, setExpanded] = useState(sectionActive);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`${navLinkClass(sectionActive)} flex-1`}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden />
          <span>{t(item.labelKey as "dashboard")}</span>
        </Link>
        {item.groups && item.groups.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer rounded-lg p-2 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text"
            aria-expanded={expanded}
            aria-label={t("toggleSection", { section: t(item.labelKey as "dashboard") })}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {expanded && item.groups
        ? item.groups.map((group) => (
            <div key={group.labelKey} className="space-y-0.5 pt-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-staff-text-muted">
                {t(group.labelKey as "dashboard")}
              </p>
              {group.items.map((link) => (
                <SubNavLink
                  key={link.href}
                  item={link}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ))
        : null}
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AppNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav-staff");
  const Icon = iconMap[item.icon];
  const isActive = isLinkActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={navLinkClass(isActive)}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden />
      <span>{t(item.labelKey as "dashboard")}</span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useSession();
  const navItems = user ? buildAppNav(user) : [];
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {navItems.map((item) =>
        item.groups && item.groups.length > 0 ? (
          <GroupedNavSection
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ),
      )}
    </div>
  );
}

function SidebarLogoutButton({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav-staff");
  const { logout } = useSession();

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        void logout();
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors duration-200 hover:bg-error-container/20"
    >
      <LogOut size={18} strokeWidth={1.75} aria-hidden />
      <span>{t("logout")}</span>
    </button>
  );
}

function SidebarChrome({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-staff-border/60 px-4">
        <Link
          href={staffRoutes.home}
          onClick={onNavigate}
          aria-label="MoPD CMS Staff Console"
          className="flex min-w-0 cursor-pointer items-center gap-2.5"
        >
          <Image
            src="/mopd_logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain"
            unoptimized
            priority
            aria-hidden
          />
          <div className="min-w-0">
            <div className="font-h3 text-h3 leading-tight text-staff-text">
              <BrandWordmark suffix=" CMS" />
            </div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-staff-text-muted">
              Staff Console
            </div>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <SidebarNav onNavigate={onNavigate} />
      </div>
      <div className="shrink-0 border-t border-staff-border/60 p-3">
        <SidebarLogoutButton onNavigate={onNavigate} />
      </div>
    </>
  );
}

export function AppSidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      <nav
        className="fixed left-0 top-0 z-20 hidden h-screen w-sidebar-wide flex-col border-r border-staff-border/60 bg-staff-sidebar md:flex"
        aria-label="Staff navigation"
      >
        <SidebarChrome />
      </nav>

      {isOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-black/50 staff-dark:bg-black/70"
            aria-label="Close menu"
            onClick={close}
          />
          <nav
            className="relative z-10 flex h-full w-sidebar-wide flex-col border-r border-staff-border bg-staff-sidebar shadow-xl"
            aria-label="Staff navigation mobile"
          >
            <SidebarChrome onNavigate={close} />
          </nav>
        </div>
      ) : null}
    </>
  );
}
