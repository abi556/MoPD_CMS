import { describe, expect, it } from "vitest";
import {
  canDeferMfaEnrollment,
  resolveMfaEnrollCanSkip,
} from "./mfa-policy";

describe("canDeferMfaEnrollment", () => {
  it("always allows deferring onboarding MFA", () => {
    expect(canDeferMfaEnrollment()).toBe(true);
  });
});

describe("resolveMfaEnrollCanSkip", () => {
  it("allows skip when not enrolled", () => {
    expect(resolveMfaEnrollCanSkip({ enrolled: false })).toBe(true);
  });

  it("disallows skip when already enrolled", () => {
    expect(resolveMfaEnrollCanSkip({ enrolled: true })).toBe(false);
  });

  it("defaults to allow skip when enrollment state unknown", () => {
    expect(resolveMfaEnrollCanSkip({})).toBe(true);
  });
});
