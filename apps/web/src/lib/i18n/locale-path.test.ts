import { describe, expect, it } from "vitest";
import {
  getLocaleFromPathname,
  isClientOnlyLocaleSwitchPath,
  replaceLocaleInPathname,
} from "./locale-path";

describe("getLocaleFromPathname", () => {
  it("reads locale from the first path segment", () => {
    expect(getLocaleFromPathname("/en/dashboard")).toBe("en");
    expect(getLocaleFromPathname("/am/dashboard/admin")).toBe("am");
  });

  it("returns null when no locale prefix is present", () => {
    expect(getLocaleFromPathname("/dashboard")).toBeNull();
  });
});

describe("isClientOnlyLocaleSwitchPath", () => {
  it("returns true for dashboard and auth routes", () => {
    expect(isClientOnlyLocaleSwitchPath("/en/dashboard")).toBe(true);
    expect(isClientOnlyLocaleSwitchPath("/am/dashboard/complaints")).toBe(true);
    expect(isClientOnlyLocaleSwitchPath("/en/auth/login")).toBe(true);
  });

  it("returns false for public portal routes", () => {
    expect(isClientOnlyLocaleSwitchPath("/en")).toBe(false);
    expect(isClientOnlyLocaleSwitchPath("/am/complaints/track")).toBe(false);
    expect(isClientOnlyLocaleSwitchPath("/en/faq")).toBe(false);
    expect(isClientOnlyLocaleSwitchPath("/am/contact")).toBe(false);
  });
});

describe("replaceLocaleInPathname", () => {
  it("replaces an existing locale prefix", () => {
    expect(replaceLocaleInPathname("/en/dashboard", "am")).toBe("/am/dashboard");
  });

  it("prefixes locale when missing", () => {
    expect(replaceLocaleInPathname("/dashboard", "am")).toBe("/am/dashboard");
  });
});
