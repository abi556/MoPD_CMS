import { hasExactPermission, hasPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";
import {
  buildAdminNavGroups,
  hasAnyAdminPermission,
} from "./build-admin-nav";
import { buildReportsNavGroups } from "./build-reports-nav";

export type AppNavIcon =
  | "layout-dashboard"
  | "inbox"
  | "mail-question"
  | "bar-chart-3"
  | "book-open"
  | "settings"
  | "user"
  | "bell";

export interface AppNavLink {
  href: string;
  labelKey: string;
}

export interface AppNavGroup {
  labelKey: string;
  items: AppNavLink[];
}

export interface AppNavItem {
  href: string;
  labelKey: string;
  icon: AppNavIcon;
  groups?: AppNavGroup[];
}

export function buildAppNav(user: SessionUser): AppNavItem[] {
  const items: AppNavItem[] = [
    { href: staffRoutes.home, labelKey: "dashboard", icon: "layout-dashboard" },
  ];

  if (
    hasPermission(user.permissions, "complaint:read") ||
    hasPermission(user.permissions, "complaint:read:own")
  ) {
    items.push({
      href: staffRoutes.complaints,
      labelKey: "complaints",
      icon: "inbox",
    });
  }

  if (hasPermission(user.permissions, "complaint:recovery:manage")) {
    items.push({
      href: staffRoutes.recoveryInquiries,
      labelKey: "recoveryInquiries",
      icon: "mail-question",
    });
  }

  const reportGroups = buildReportsNavGroups(user);
  if (reportGroups.length > 0) {
    items.push({
      href: staffRoutes.reports.root,
      labelKey: "reports",
      icon: "bar-chart-3",
      groups: reportGroups,
    });
  }

  if (hasExactPermission(user.permissions, "knowledge:manage")) {
    items.push({
      href: staffRoutes.admin.knowledge,
      labelKey: "knowledgeBase",
      icon: "book-open",
    });
  }

  if (hasAnyAdminPermission(user)) {
    const adminGroups = buildAdminNavGroups(user);
    if (adminGroups.length > 0) {
      items.push({
        href: staffRoutes.admin.root,
        labelKey: "admin",
        icon: "settings",
        groups: adminGroups,
      });
    }
  }

  items.push({
    href: staffRoutes.profile,
    labelKey: "profile",
    icon: "user",
  });

  return items;
}
