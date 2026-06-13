import { describe, expect, it } from "vitest";
import {
  buildAdminNav,
  buildAdminNavGroups,
  hasAnyAdminPermission,
} from "./build-admin-nav";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";

function user(permissions: string[]): SessionUser {
  return {
    id: "1",
    email: "admin@mopd.local",
    roles: ["SystemAdmin"],
    permissions,
  };
}

describe("buildAdminNavGroups", () => {
  it("returns people group for user:manage", () => {
    const groups = buildAdminNavGroups(user(["user:manage"]));
    const people = groups.find((g) => g.labelKey === "adminGroupPeople");
    expect(people?.items.some((i) => i.href === staffRoutes.admin.users)).toBe(
      true,
    );
  });

  it("returns communications group for template:manage only", () => {
    const groups = buildAdminNavGroups(user(["template:manage"]));
    expect(groups).toHaveLength(1);
    expect(groups[0].labelKey).toBe("adminGroupComms");
    expect(
      groups[0].items.some((i) => i.href === staffRoutes.admin.templates),
    ).toBe(true);
    expect(
      groups[0].items.some((i) => i.href === staffRoutes.admin.categories),
    ).toBe(false);
  });

  it("buildAdminNav flattens all group items", () => {
    const flat = buildAdminNav(user(["user:manage", "audit:read"]));
    expect(flat.length).toBeGreaterThan(1);
  });

  it("hasAnyAdminPermission is false without admin perms", () => {
    expect(hasAnyAdminPermission(user(["complaint:read"]))).toBe(false);
  });
});
