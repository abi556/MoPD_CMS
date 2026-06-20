import { describe, expect, it } from "vitest";
import { buildAppNav } from "./build-app-nav";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "@/lib/auth/session-types";
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SuperAdmin: ["complaint:read", "complaint:recovery:manage", "report:view", "report:export", "audit:read", "user:manage", "role:manage", "config:manage", "sla:configure", "template:manage", "notification:manage", "admin:ping"],
  SystemAdmin: ["user:manage", "role:manage", "config:manage", "sla:configure", "template:manage", "notification:manage", "admin:ping"],
  ComplaintsAdmin: ["complaint:read", "complaint:recovery:manage", "workflow:transition"],
  CaseOfficer: ["complaint:read:own", "workflow:transition"],
  ReviewerApprover: ["complaint:read", "complaint:review", "complaint:approve", "workflow:transition"],
  Ombudsperson: ["complaint:read", "complaint:escalate", "audit:read", "report:view"],
  ReadOnlyObserver: ["complaint:read", "report:view"],
  Auditor: ["audit:read", "report:view", "report:export"],
  CommunicationsOfficer: ["template:manage", "notification:manage"],
};

function sessionUser(role: string): SessionUser {
  return {
    id: "1",
    email: `${role}@mopd.local`,
    roles: [role],
    permissions: ROLE_PERMISSIONS[role] ?? [],
  };
}

function navHrefs(role: string): string[] {
  return buildAppNav(sessionUser(role)).map((item) => item.href);
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

  it("CommunicationsOfficer sees admin without top-level inbox nav", () => {
    const hrefs = navHrefs("CommunicationsOfficer");
    expect(hrefs).toEqual([
      staffRoutes.home,
      staffRoutes.admin.root,
      staffRoutes.profile,
    ]);
  });

  it("SystemAdmin sees dashboard and admin", () => {
    const hrefs = navHrefs("SystemAdmin");
    expect(hrefs).toContain(staffRoutes.admin.root);
    expect(hrefs).not.toContain(staffRoutes.complaints);
  });

  it("ReviewerApprover sees dashboard and complaints", () => {
    expect(navHrefs("ReviewerApprover")).toEqual([
      staffRoutes.home,
      staffRoutes.complaints,
      staffRoutes.profile,
    ]);
  });

  it("Ombudsperson sees complaints and reports with audit in oversight group", () => {
    const hrefs = navHrefs("Ombudsperson");
    expect(hrefs).toContain(staffRoutes.complaints);
    expect(hrefs).toContain(staffRoutes.reports.root);
    expect(hrefs).not.toContain(staffRoutes.admin.root);
    const reportsNav = buildAppNav(sessionUser("Ombudsperson")).find(
      (item) => item.labelKey === "reports",
    );
    const oversightHrefs =
      reportsNav?.groups?.flatMap((group) => group.items.map((i) => i.href)) ??
      [];
    expect(oversightHrefs).toContain(staffRoutes.admin.audit);
  });

  it("ReadOnlyObserver sees reports and complaints read-only nav", () => {
    const hrefs = navHrefs("ReadOnlyObserver");
    expect(hrefs).toContain(staffRoutes.reports.root);
    expect(hrefs).toContain(staffRoutes.complaints);
    expect(hrefs).not.toContain(staffRoutes.admin.root);
  });

  it("SuperAdmin sees complaints, reports, and admin", () => {
    const hrefs = navHrefs("SuperAdmin");
    expect(hrefs).toContain(staffRoutes.complaints);
    expect(hrefs).toContain(staffRoutes.reports.root);
    expect(hrefs).toContain(staffRoutes.admin.root);
  });
});
