"use client";

import {
  BarChart3,
  Bell,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  LogOut,
  MailQuestion,
  PanelLeft,
  PanelLeftClose,
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

function navLinkClass(isActive: boolean, depth = 0, collapsed = false) {
  const base = collapsed
    ? "flex items-center justify-center rounded-lg p-2.5 transition-colors duration-200"
    : depth > 0
      ? "relative flex items-center rounded-lg py-2 pl-8 pr-3 text-[13px] transition-colors duration-200"
      : "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200";

  if (!isActive) {
    return `${base} cursor-pointer text-staff-text-muted hover:bg-staff-nav-hover hover:text-staff-text`;
  }

  if (collapsed) {
    return `${base} cursor-pointer bg-staff-nav-active/10 text-staff-nav-active`;
  }

  return `${base} cursor-pointer bg-staff-nav-active/10 font-medium text-staff-nav-active before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-staff-nav-active before:content-['']`;
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
  collapsed = false,
}: {
  item: AppNavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
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
  const label = t(item.labelKey as "dashboard");

  if (collapsed) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        title={label}
        className={navLinkClass(sectionActive, 0, true)}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden />
        <span className="sr-only">{label}</span>
      </Link>
    );
  }

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
            className="cursor-pointer rounded-md p-1.5 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text"
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
              <p className="px-3 pb-1 text-[11px] font-medium text-staff-text-muted/80">
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
  collapsed = false,
}: {
  item: AppNavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const t = useTranslations("nav-staff");
  const Icon = iconMap[item.icon];
  const isActive = isLinkActive(pathname, item.href);
  const label = t(item.labelKey as "dashboard");

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={navLinkClass(isActive, 0, collapsed)}
    >
      <Icon size={collapsed ? 20 : 18} strokeWidth={1.75} aria-hidden />
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </Link>
  );
}

function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
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
            collapsed={collapsed}
          />
        ) : (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ),
      )}
    </div>
  );
}

function SidebarLogoutButton({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const t = useTranslations("nav-staff");
  const { logout } = useSession();
  const label = t("logout");

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        void logout();
      }}
      title={collapsed ? label : undefined}
      className={
        collapsed
          ? "flex w-full cursor-pointer items-center justify-center rounded-lg p-2.5 text-danger/90 transition-colors duration-200 hover:bg-error-container/15"
          : "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger/90 transition-colors duration-200 hover:bg-error-container/15"
      }
    >
      <LogOut size={collapsed ? 20 : 18} strokeWidth={1.75} aria-hidden />
      {collapsed ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </button>
  );
}

function SidebarChrome({
  onNavigate,
  collapsed = false,
  onCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}) {
  const t = useTranslations("nav-staff");

  return (
    <>
      <div
        className={`flex h-15 shrink-0 items-center ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {collapsed ? (
          onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              className="hidden cursor-pointer rounded-md p-1.5 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text md:inline-flex"
              aria-label={t("expandSidebar")}
            >
              <PanelLeft size={18} aria-hidden />
            </button>
          ) : null
        ) : (
          <>
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
                className="h-8 w-8 shrink-0 object-contain"
                unoptimized
                priority
                aria-hidden
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight text-staff-text">
                  <BrandWordmark suffix=" CMS" />
                </div>
                <div className="mt-0.5 text-xs text-staff-text-muted">
                  Staff console
                </div>
              </div>
            </Link>
            {onCollapse ? (
              <button
                type="button"
                onClick={onCollapse}
                className="hidden cursor-pointer rounded-md p-1.5 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text md:inline-flex"
                aria-label={t("collapseSidebar")}
              >
                <PanelLeftClose size={18} aria-hidden />
              </button>
            ) : null}
          </>
        )}
      </div>
      <div className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
        <SidebarNav onNavigate={onNavigate} collapsed={collapsed} />
      </div>
      <div className={`shrink-0 ${collapsed ? "p-2 pb-4" : "p-3 pb-4"}`}>
        <SidebarLogoutButton onNavigate={onNavigate} collapsed={collapsed} />
      </div>
    </>
  );
}

export function AppSidebar() {
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <>
      <nav
        className={`fixed left-0 top-0 z-20 hidden h-screen flex-col bg-staff-sidebar transition-[width] duration-300 ease-out md:flex ${
          isCollapsed ? "w-sidebar-collapsed" : "w-sidebar-wide"
        }`}
        aria-label="Staff navigation"
      >
        <SidebarChrome collapsed={isCollapsed} onCollapse={toggleCollapsed} />
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
            className="relative z-10 flex h-full w-sidebar-wide flex-col bg-staff-sidebar shadow-2xl"
            aria-label="Staff navigation mobile"
          >
            <SidebarChrome onNavigate={close} />
          </nav>
        </div>
      ) : null}
    </>
  );
}
