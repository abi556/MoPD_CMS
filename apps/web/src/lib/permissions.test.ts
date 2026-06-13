import { describe, expect, it } from "vitest";
import { hasAnyPermission, hasPermission } from "./permissions";

describe("hasAnyPermission", () => {
  it("returns true when any required permission is granted", () => {
    expect(
      hasAnyPermission(["complaint:read:own"], [
        "complaint:read",
        "complaint:read:own",
      ]),
    ).toBe(true);
  });

  it("returns false when none of the required permissions are granted", () => {
    expect(
      hasAnyPermission(["case:read"], ["complaint:read", "complaint:read:own"]),
    ).toBe(false);
  });

  it("returns true for empty required list", () => {
    expect(hasAnyPermission(["complaint:read"], [])).toBe(true);
  });
});

describe("hasPermission complaint aliases", () => {
  it("accepts legacy complaints:list as complaint:read", () => {
    expect(hasPermission(["complaints:list"], "complaint:read")).toBe(true);
  });
});
