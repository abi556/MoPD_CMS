import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  COOKIE_POLICY_VERSION,
  COOKIE_STORAGE_KEYS,
  acceptAllCookies,
  getStoredConsent,
  hasAnalyticsConsent,
  isNoticeDismissed,
  rejectNonEssentialCookies,
  shouldShowCookieNotice,
} from "@/lib/public/cookie-consent";
import { ANALYTICS_SESSION_KEY } from "@/lib/public/web-analytics-constants";

describe("cookie-consent", () => {
  beforeEach(() => {
    document.cookie = `${COOKIE_STORAGE_KEYS.consent}=; path=/; max-age=0`;
    document.cookie = `${COOKIE_STORAGE_KEYS.noticeDismissed}=; path=/; max-age=0`;
    localStorage.clear();
  });

  it("uses stable policy version and storage key names", () => {
    expect(COOKIE_POLICY_VERSION).toBe("2026-06-01");
    expect(COOKIE_STORAGE_KEYS.consent).toBe("mopd_cookie_consent");
    expect(COOKIE_STORAGE_KEYS.noticeDismissed).toBe(
      "mopd_cookie_notice_dismissed",
    );
  });

  it("enables analytics only after accept all", () => {
    expect(hasAnalyticsConsent()).toBe(false);
    acceptAllCookies();
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("clears analytics session id when rejecting non-essential cookies", () => {
    localStorage.setItem(ANALYTICS_SESSION_KEY, "old-session");
    rejectNonEssentialCookies();
    expect(hasAnalyticsConsent()).toBe(false);
    expect(localStorage.getItem(ANALYTICS_SESSION_KEY)).toBeNull();
  });

  it("dispatches consent updated event on persist", () => {
    const handler = vi.fn();
    window.addEventListener("mopd:consent-updated", handler);
    acceptAllCookies();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("mopd:consent-updated", handler);
  });

  it("returns null for malformed or invalid stored consent", () => {
    document.cookie = `${COOKIE_STORAGE_KEYS.consent}=${encodeURIComponent("not-json")}; path=/`;
    expect(getStoredConsent()).toBeNull();

    document.cookie = `${COOKIE_STORAGE_KEYS.consent}=${encodeURIComponent(
      JSON.stringify({ version: "x", categories: { essential: false, analytics: true } }),
    )}; path=/`;
    expect(getStoredConsent()).toBeNull();
  });

  it("tracks notice dismissal and visibility", () => {
    expect(isNoticeDismissed()).toBe(false);
    expect(shouldShowCookieNotice()).toBe(true);

    document.cookie = `${COOKIE_STORAGE_KEYS.noticeDismissed}=1; path=/`;
    expect(isNoticeDismissed()).toBe(true);
    expect(shouldShowCookieNotice()).toBe(false);

    acceptAllCookies();
    expect(shouldShowCookieNotice()).toBe(false);
  });

  it("keeps analytics session when accepting analytics", () => {
    localStorage.setItem(ANALYTICS_SESSION_KEY, "keep-session");
    acceptAllCookies();
    expect(localStorage.getItem(ANALYTICS_SESSION_KEY)).toBe("keep-session");
  });
});
