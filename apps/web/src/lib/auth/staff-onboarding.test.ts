import { describe, expect, it } from "vitest";
import {
  resolvePostPasswordChangePath,
  resolveStaffOnboardingPath,
} from "./staff-onboarding";
import { staffRoutes } from "@/lib/staff/routes";
import type { SessionUser } from "./session-types";

const baseUser: SessionUser = {
  id: "u1",
  email: "officer@mopd.local",
  roles: ["CaseOfficer"],
  permissions: [],
};

describe("resolveStaffOnboardingPath", () => {
  it("routes to change password when required", () => {
    expect(
      resolveStaffOnboardingPath({ ...baseUser, mustChangePassword: true }),
    ).toBe(staffRoutes.auth.changePassword);
  });

  it("routes to MFA enroll when soft prompt flag is set and not enrolled", () => {
    expect(
      resolveStaffOnboardingPath({
        ...baseUser,
        mustChangePassword: false,
        mustEnrollMfa: true,
        mfaEnrolled: false,
      }),
    ).toBe(staffRoutes.auth.mfaEnroll);
  });

  it("routes to role landing when MFA prompt was cleared", () => {
    expect(
      resolveStaffOnboardingPath({
        ...baseUser,
        mustChangePassword: false,
        mustEnrollMfa: false,
        mfaEnrolled: false,
      }),
    ).toContain("/dashboard");
  });

  it("routes to role landing when MFA already enrolled", () => {
    expect(
      resolveStaffOnboardingPath({
        ...baseUser,
        mustChangePassword: false,
        mustEnrollMfa: true,
        mfaEnrolled: true,
      }),
    ).toContain("/dashboard");
  });
});

describe("resolvePostPasswordChangePath", () => {
  it("surfaces MFA enroll when not yet enrolled", () => {
    expect(
      resolvePostPasswordChangePath({
        ...baseUser,
        mustChangePassword: false,
        mustEnrollMfa: false,
        mfaEnrolled: false,
      }),
    ).toBe(staffRoutes.auth.mfaEnroll);
  });

  it("continues onboarding when MFA already enrolled", () => {
    expect(
      resolvePostPasswordChangePath({
        ...baseUser,
        mustChangePassword: false,
        mustEnrollMfa: false,
        mfaEnrolled: true,
      }),
    ).toContain("/dashboard");
  });
});
