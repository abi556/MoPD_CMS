import { describe, expect, it } from "vitest";
import { resolvePostLoginPath } from "./post-login-redirect";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "./session-types";

function user(roles: string[]): SessionUser {
  return {
    id: "1",
    email: "test@mopd.local",
    roles,
    permissions: [],
  };
}

describe("resolvePostLoginPath", () => {
  it("routes SystemAdmin to admin hub", () => {
    expect(resolvePostLoginPath(user(["SystemAdmin"]))).toBe(
      staffRoutes.admin.root,
    );
  });

  it("routes CaseOfficer to triage queue", () => {
    expect(resolvePostLoginPath(user(["CaseOfficer"]))).toBe(
      "/dashboard/complaints?queue=triage",
    );
  });

  it("routes ReviewerApprover to QA filter", () => {
    expect(resolvePostLoginPath(user(["ReviewerApprover"]))).toBe(
      "/dashboard/complaints?status=QA_LEGAL_REVIEW",
    );
  });

  it("defaults to dashboard home for unknown roles", () => {
    expect(resolvePostLoginPath(user([]))).toBe(staffRoutes.home);
  });
});
