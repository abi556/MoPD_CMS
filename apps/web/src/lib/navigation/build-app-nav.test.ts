import { describe, expect, it } from "vitest";
import { buildAppNav } from "./build-app-nav";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";

function user(permissions: string[], roles: string[] = []): SessionUser {
  return {
    id: "1",
    email: "test@mopd.local",
    roles,
    permissions,
  };
}

describe("buildAppNav", () => {
  it("shows dashboard only when user lacks complaint read", () => {
    const nav = buildAppNav(user([]));
    expect(nav).toHaveLength(2);
    expect(nav[0].href).toBe(staffRoutes.home);
    expect(nav[1].href).toBe(staffRoutes.profile);
  });

  it("includes complaints when user has complaint:read", () => {
    const nav = buildAppNav(user(["complaint:read"]));
    expect(nav.map((i) => i.href)).toEqual([
      staffRoutes.home,
      staffRoutes.complaints,
      staffRoutes.profile,
    ]);
  });

  it("includes recovery when user has complaint:recovery:manage", () => {
    const nav = buildAppNav(user(["complaint:recovery:manage"]));
    expect(nav.some((i) => i.href === staffRoutes.recoveryInquiries)).toBe(
      true,
    );
  });

  it("includes reports with groups when user has report:view", () => {
    const nav = buildAppNav(user(["report:view"]));
    const reports = nav.find((i) => i.href === staffRoutes.reports.root);
    expect(reports).toBeDefined();
    expect(reports?.groups?.length).toBeGreaterThan(0);
  });

  it("includes audit under reports when user has audit:read and report:view", () => {
    const nav = buildAppNav(user(["report:view", "audit:read"]));
    const reports = nav.find((i) => i.href === staffRoutes.reports.root);
    const oversight = reports?.groups?.find(
      (g) => g.labelKey === "reportsGroupOversight",
    );
    expect(
      oversight?.items.some((i) => i.href === staffRoutes.admin.audit),
    ).toBe(true);
  });

  it("includes admin with grouped children when user has user:manage", () => {
    const nav = buildAppNav(user(["user:manage"]));
    const admin = nav.find((i) => i.href === staffRoutes.admin.root);
    expect(admin).toBeDefined();
    expect(admin?.groups?.some((g) => g.labelKey === "adminGroupPeople")).toBe(
      true,
    );
  });

  it("puts audit under reports (not admin) when user has audit:read only", () => {
    const nav = buildAppNav(user(["audit:read"]));
    expect(nav.some((i) => i.href === staffRoutes.admin.root)).toBe(false);
    const reports = nav.find((i) => i.href === staffRoutes.reports.root);
    const oversight = reports?.groups?.find(
      (g) => g.labelKey === "reportsGroupOversight",
    );
    expect(
      oversight?.items.some((i) => i.href === staffRoutes.admin.audit),
    ).toBe(true);
  });

  it("includes notifications when user has notification:manage", () => {
    const nav = buildAppNav(user(["notification:manage"]));
    expect(nav.some((i) => i.href === staffRoutes.notifications)).toBe(true);
  });
});
