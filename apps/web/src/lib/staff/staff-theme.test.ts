import { describe, expect, it } from "vitest";
import {
  cycleThemePreference,
  isStaffThemePreference,
  parseThemePreference,
  resolveStaffTheme,
} from "./staff-theme";

describe("resolveStaffTheme", () => {
  it("returns light when preference is light", () => {
    expect(resolveStaffTheme("light", true)).toBe("light");
  });

  it("returns dark when preference is dark", () => {
    expect(resolveStaffTheme("dark", false)).toBe("dark");
  });

  it("follows system when preference is system", () => {
    expect(resolveStaffTheme("system", true)).toBe("dark");
    expect(resolveStaffTheme("system", false)).toBe("light");
  });
});

describe("parseThemePreference", () => {
  it("returns valid preferences unchanged", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
  });

  it("falls back to system for invalid values", () => {
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("")).toBe("system");
    expect(parseThemePreference("invalid")).toBe("system");
  });
});

describe("isStaffThemePreference", () => {
  it("narrows known theme values", () => {
    expect(isStaffThemePreference("dark")).toBe(true);
    expect(isStaffThemePreference("nope")).toBe(false);
  });
});

describe("cycleThemePreference", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(cycleThemePreference("system")).toBe("light");
    expect(cycleThemePreference("light")).toBe("dark");
    expect(cycleThemePreference("dark")).toBe("system");
  });
});
