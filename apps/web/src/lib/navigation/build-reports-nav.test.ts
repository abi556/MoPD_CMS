import { describe, expect, it } from "vitest";
import { buildReportsNavGroups } from "./build-reports-nav";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";

function user(permissions: string[]): SessionUser {
  return {
    id: "1",
    email: "auditor@mopd.local",
    roles: ["Auditor"],
    permissions,
  };
}

describe("buildReportsNavGroups", () => {
  it("returns analytics group for report:view", () => {
    const groups = buildReportsNavGroups(user(["report:view"]));
    const analytics = groups.find((g) => g.labelKey === "reportsGroupAnalytics");
    expect(analytics?.items.some((i) => i.href === staffRoutes.reports.volume)).toBe(
      true,
    );
  });

  it("includes audit in oversight when audit:read", () => {
    const groups = buildReportsNavGroups(user(["report:view", "audit:read"]));
    const oversight = groups.find((g) => g.labelKey === "reportsGroupOversight");
    expect(
      oversight?.items.some((i) => i.href === staffRoutes.admin.audit),
    ).toBe(true);
  });

  it("includes exports when report:export", () => {
    const groups = buildReportsNavGroups(user(["report:export"]));
    const oversight = groups.find((g) => g.labelKey === "reportsGroupOversight");
    expect(
      oversight?.items.some((i) => i.href === staffRoutes.reports.exports),
    ).toBe(true);
  });
});
