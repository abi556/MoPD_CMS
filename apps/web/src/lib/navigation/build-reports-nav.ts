import { hasPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";
import type { AppNavGroup } from "./build-app-nav";

const ANALYTICS_ITEMS: Array<{
  href: string;
  labelKey: string;
  permission: string;
}> = [
  {
    href: staffRoutes.reports.root,
    labelKey: "reportsOverview",
    permission: "report:view",
  },
  {
    href: staffRoutes.reports.volume,
    labelKey: "reportsVolume",
    permission: "report:view",
  },
  {
    href: staffRoutes.reports.sla,
    labelKey: "reportsSla",
    permission: "report:view",
  },
  {
    href: staffRoutes.reports.resolution,
    labelKey: "reportsResolution",
    permission: "report:view",
  },
  {
    href: staffRoutes.reports.channels,
    labelKey: "reportsChannels",
    permission: "report:view",
  },
];

const OVERSIGHT_ITEMS: Array<{
  href: string;
  labelKey: string;
  permission: string;
}> = [
  {
    href: staffRoutes.admin.audit,
    labelKey: "adminAudit",
    permission: "audit:read",
  },
  {
    href: staffRoutes.reports.exports,
    labelKey: "reportsExports",
    permission: "report:export",
  },
];

function filterItems(
  user: SessionUser,
  items: typeof ANALYTICS_ITEMS,
): Array<{ href: string; labelKey: string }> {
  return items
    .filter((item) => hasPermission(user.permissions, item.permission))
    .map(({ href, labelKey }) => ({ href, labelKey }));
}

export function buildReportsNavGroups(user: SessionUser): AppNavGroup[] {
  const groups: AppNavGroup[] = [];

  const analytics = filterItems(user, ANALYTICS_ITEMS);
  if (analytics.length > 0) {
    groups.push({ labelKey: "reportsGroupAnalytics", items: analytics });
  }

  const oversight = filterItems(user, OVERSIGHT_ITEMS);
  if (oversight.length > 0) {
    groups.push({ labelKey: "reportsGroupOversight", items: oversight });
  }

  return groups;
}

export function hasAnyReportsPermission(user: SessionUser): boolean {
  return buildReportsNavGroups(user).length > 0;
}
