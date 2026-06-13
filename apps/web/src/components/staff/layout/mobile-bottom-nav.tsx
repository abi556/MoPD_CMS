"use client";

import { Home, Inbox, MoreHorizontal, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { buildAppNav } from "@/lib/navigation/build-app-nav";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";

const PRIMARY_HREFS: ReadonlySet<string> = new Set([
  staffRoutes.home,
  staffRoutes.complaints,
]);

export function MobileBottomNav() {
  const t = useTranslations("nav-staff");
  const { user } = useSession();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const navItems = user ? buildAppNav(user) : [];
  const moreItems = navItems.filter(
    (item) =>
      !PRIMARY_HREFS.has(item.href) && item.href !== staffRoutes.profile,
  );

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!sheetRef.current?.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", onPointerDown);
    }
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [moreOpen]);

  const moreActive = moreItems.some(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      item.groups?.some((group) =>
        group.items.some(
          (link) =>
            pathname === link.href || pathname.startsWith(`${link.href}/`),
        ),
      ),
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-staff-border bg-staff-surface md:hidden"
        aria-label="Mobile staff navigation"
      >
        <Link
          href={staffRoutes.home}
          className={`flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-xs ${
            pathname === staffRoutes.home
              ? "text-staff-nav-active"
              : "text-staff-text-muted"
          }`}
        >
          <Home size={20} aria-hidden />
          {t("dashboard")}
        </Link>
        {navItems.some((i) => i.href === staffRoutes.complaints) ? (
          <Link
            href={staffRoutes.complaints}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-xs ${
              pathname.startsWith(staffRoutes.complaints)
                ? "text-staff-nav-active"
                : "text-staff-text-muted"
            }`}
          >
            <Inbox size={20} aria-hidden />
            {t("complaints")}
          </Link>
        ) : null}
        {moreItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-xs ${
              moreActive ? "text-staff-nav-active" : "text-staff-text-muted"
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal size={20} aria-hidden />
            {t("menu")}
          </button>
        ) : null}
        <Link
          href={staffRoutes.profile}
          className={`flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-xs ${
            pathname.startsWith(staffRoutes.profile)
              ? "text-staff-nav-active"
              : "text-staff-text-muted"
          }`}
        >
          <User size={20} aria-hidden />
          {t("profile")}
        </Link>
      </nav>

      {moreOpen && moreItems.length > 0 ? (
        <div
          ref={sheetRef}
          role="menu"
          className="fixed bottom-16 left-0 right-0 z-40 max-h-[60vh] overflow-y-auto border-t border-staff-border bg-staff-surface p-4 shadow-lg md:hidden"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-staff-text-muted">
            {t("menu")}
          </p>
          <ul className="space-y-1">
            {moreItems.flatMap((item) => {
              if (item.groups && item.groups.length > 0) {
                return item.groups.flatMap((group) =>
                  group.items.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm text-staff-text hover:bg-staff-nav-hover"
                      >
                        {t(link.labelKey as "dashboard")}
                      </Link>
                    </li>
                  )),
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm text-staff-text hover:bg-staff-nav-hover"
                  >
                    {t(item.labelKey as "dashboard")}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
