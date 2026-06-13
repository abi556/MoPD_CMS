import { describe, expect, it } from "vitest";
import { buildAppNav } from "./build-app-nav";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";

/** Mirrors RBAC seed role permission sets (subset for nav visibility). */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SuperAdmin: ["complaint:read", "complaint:recovery:manage", "report:view", "report:export", "audit:read", "user:manage", "role:manage", "config:manage", "sla:configure", "template:manage", "notification:manage", "admin:ping"],
  SystemAdmin: ["user:manage", "role:manage", "config:manage", "sla:configure", "template:manage", "notification:manage", "admin:ping"],
  ComplaintsAdmin: ["complaint:read", "complaint:recovery:manage", "workflow:transition"],
  CaseOfficer: ["complaint:read:own", "workflow:transition"],
  Auditor: ["audit:read", "report:view", "report:export"],
  CommunicationsOfficer: ["template:manage", "notification:manage"],
};

function navHrefs(role: string): string[] {
  const u: SessionUser = {
    id: "1",
    email: `${role}@mopd.local`,
    roles: [role],
    permissions: ROLE_PERMISSIONS[role] ?? [],
  };
  return buildAppNav(u).map((item) => item.href);
}

describe("nav permission matrix", () => {
  it("CaseOfficer sees dashboard and complaints only", () => {
    expect(navHrefs("CaseOfficer")).toEqual([
      staffRoutes.home,
      staffRoutes.complaints,
      staffRoutes.profile,
    ]);
  });

  it("ComplaintsAdmin sees recovery", () => {
    expect(navHrefs("ComplaintsAdmin")).toContain(staffRoutes.recoveryInquiries);
  });

  it("Auditor sees reports not admin", () => {
    const hrefs = navHrefs("Auditor");
    expect(hrefs).toContain(staffRoutes.reports.root);
    expect(hrefs).not.toContain(staffRoutes.admin.root);
  });

  it("CommunicationsOfficer sees admin and notifications", () => {
    const hrefs = navHrefs("CommunicationsOfficer");
    expect(hrefs).toEqual([
      staffRoutes.home,
      staffRoutes.admin.root,
      staffRoutes.notifications,
      staffRoutes.profile,
    ]);
  });

  it("SystemAdmin sees dashboard and admin", () => {
    const hrefs = navHrefs("SystemAdmin");
    expect(hrefs).toContain(staffRoutes.admin.root);
    expect(hrefs).not.toContain(staffRoutes.complaints);
  });
});
