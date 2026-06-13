import { describe, expect, it } from "vitest";
import {
  getLocaleFromPathname,
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

describe("replaceLocaleInPathname", () => {
  it("replaces an existing locale prefix", () => {
    expect(replaceLocaleInPathname("/en/dashboard", "am")).toBe("/am/dashboard");
  });

  it("prefixes locale when missing", () => {
    expect(replaceLocaleInPathname("/dashboard", "am")).toBe("/am/dashboard");
  });
});
