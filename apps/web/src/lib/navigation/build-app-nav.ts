import { hasPermission } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth/session-types";

export interface AppNavItem {
  href: string;
  labelKey: string;
  icon: "layout-dashboard" | "inbox" | "bar-chart-3" | "settings";
}

const ALL_ITEMS: AppNavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: "layout-dashboard" },
  {
    href: "/dashboard/complaints",
    labelKey: "complaints",
    icon: "inbox",
  },
  { href: "/dashboard/reports", labelKey: "reports", icon: "bar-chart-3" },
  { href: "/dashboard/admin", labelKey: "admin", icon: "settings" },
];

export function buildAppNav(user: SessionUser): AppNavItem[] {
  const items: AppNavItem[] = [];

  if (
    hasPermission(user.permissions, "complaint:read") ||
    hasPermission(user.permissions, "complaint:read:own")
  ) {
    items.push(ALL_ITEMS[0], ALL_ITEMS[1]);
  } else {
    items.push(ALL_ITEMS[0]);
  }

  if (hasPermission(user.permissions, "report:view")) {
    items.push(ALL_ITEMS[2]);
  }

  if (
    hasPermission(user.permissions, "user:manage") ||
    hasPermission(user.permissions, "role:manage") ||
    hasPermission(user.permissions, "config:manage")
  ) {
    items.push(ALL_ITEMS[3]);
  }

  return items.filter(
    (item, index, arr) => arr.findIndex((i) => i.href === item.href) === index,
  );
}
