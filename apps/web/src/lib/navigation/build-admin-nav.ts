import { hasExactPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";
import type { AppNavGroup } from "./build-app-nav";

const ADMIN_GROUPS: Array<{
  labelKey: string;
  items: Array<{ href: string; labelKey: string; permission: string }>;
}> = [
  {
    labelKey: "adminGroupPeople",
    items: [
      {
        href: staffRoutes.admin.users,
        labelKey: "adminUsers",
        permission: "user:manage",
      },
      {
        href: staffRoutes.admin.roles,
        labelKey: "adminRoles",
        permission: "role:manage",
      },
    ],
  },
  {
    labelKey: "adminGroupReference",
    items: [
      {
        href: staffRoutes.admin.categories,
        labelKey: "adminCategories",
        permission: "config:manage",
      },
      {
        href: staffRoutes.admin.orgUnits,
        labelKey: "adminOrgUnits",
        permission: "config:manage",
      },
      {
        href: staffRoutes.admin.sla,
        labelKey: "adminSla",
        permission: "sla:configure",
      },
    ],
  },
  {
    labelKey: "adminGroupComms",
    items: [
      {
        href: staffRoutes.admin.templates,
        labelKey: "adminTemplates",
        permission: "template:manage",
      },
      {
        href: staffRoutes.admin.notifications,
        labelKey: "adminEmailDeliveries",
        permission: "notification:manage",
      },
    ],
  },
  {
    labelKey: "adminGroupSystem",
    items: [
      {
        href: staffRoutes.admin.system,
        labelKey: "adminSystem",
        permission: "admin:ping",
      },
      {
        href: staffRoutes.admin.audit,
        labelKey: "adminAudit",
        permission: "audit:read",
      },
    ],
  },
];

const ADMIN_SECTION_PERMISSIONS = [
  "user:manage",
  "role:manage",
  "config:manage",
  "sla:configure",
  "template:manage",
  "notification:manage",
  "admin:ping",
] as const;

export function buildAdminNavGroups(user: SessionUser): AppNavGroup[] {
  return ADMIN_GROUPS.map((group) => ({
    labelKey: group.labelKey,
    items: group.items
      .filter((item) =>
        hasExactPermission(user.permissions, item.permission),
      )
      .map(({ href, labelKey }) => ({ href, labelKey })),
  })).filter((group) => group.items.length > 0);
}

/** @deprecated Use buildAdminNavGroups — flat list for legacy callers */
export function buildAdminNav(user: SessionUser) {
  return buildAdminNavGroups(user).flatMap((group) => group.items);
}

/** Top-level Admin nav — config permissions only; audit:read is under Reports. */
export function hasAnyAdminPermission(user: SessionUser): boolean {
  return ADMIN_SECTION_PERMISSIONS.some((permission) =>
    hasExactPermission(user.permissions, permission),
  );
}
