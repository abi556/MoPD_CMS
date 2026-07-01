import { describe, expect, it } from "vitest";
import {
  isAuthCookiePath,
  isPublicApiPath,
  resolveApiCredentials,
} from "@/lib/api-credentials";

describe("api-credentials", () => {
  it("treats analytics events as a public API path", () => {
    expect(isPublicApiPath("/analytics/events")).toBe(true);
    expect(resolveApiCredentials("/analytics/events")).toBe("omit");
  });

  it("keeps consent and contact paths public", () => {
    expect(isPublicApiPath("/consent/cookie")).toBe(true);
    expect(isPublicApiPath("/contact")).toBe(true);
  });

  it("treats citizen complaint routes as public", () => {
    expect(isPublicApiPath("/complaints")).toBe(true);
    expect(isPublicApiPath("/complaints/track/ABC")).toBe(true);
    expect(isPublicApiPath("/complaints/form-options")).toBe(true);
    expect(isPublicApiPath("/complaints/ref-1/evidence")).toBe(true);
    expect(resolveApiCredentials("/complaints")).toBe("omit");
  });

  it("treats password reset routes as public", () => {
    expect(isPublicApiPath("/auth/forgot-password")).toBe(true);
    expect(isPublicApiPath("/auth/reset-password/token")).toBe(true);
  });

  it("uses include credentials for auth cookie paths", () => {
    expect(isAuthCookiePath("/auth/login")).toBe(true);
    expect(isAuthCookiePath("auth/refresh")).toBe(true);
    expect(resolveApiCredentials("/auth/login")).toBe("include");
    expect(resolveApiCredentials("/auth/refresh")).toBe("include");
    expect(resolveApiCredentials("/auth/logout")).toBe("include");
  });

  it("defaults protected paths to omit credentials", () => {
    expect(isPublicApiPath("/users/me")).toBe(false);
    expect(isAuthCookiePath("/users/me")).toBe(false);
    expect(resolveApiCredentials("/users/me")).toBe("omit");
  });
});
