/**
 * Cookie consent storage and policy version for MoPD CMS (PDPP 1321/2024).
 */

import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_SESSION_KEY,
} from "@/lib/public/web-analytics-constants";

export const COOKIE_POLICY_VERSION = "2026-06-01";

export const COOKIE_STORAGE_KEYS = {
  noticeDismissed: "mopd_cookie_notice_dismissed",
  consent: "mopd_cookie_consent",
} as const;

export type CookieConsentAction =
  | "accept_all"
  | "reject_non_essential"
  | "save_preferences";

export interface CookieConsentCategories {
  essential: true;
  analytics: boolean;
}

export interface StoredCookieConsent {
  version: string;
  categories: CookieConsentCategories;
  updatedAt: string;
}

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; samesite=lax${secure}`;
}

export function getStoredConsent(): StoredCookieConsent | null {
  const raw = readCookie(COOKIE_STORAGE_KEYS.consent);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (
      parsed?.version &&
      parsed.categories &&
      parsed.categories.essential === true &&
      typeof parsed.categories.analytics === "boolean"
    ) {
      return parsed;
    }
  } catch {
    /* ignore malformed cookie */
  }
  return null;
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent()?.categories.analytics === true;
}

export function isNoticeDismissed(): boolean {
  return readCookie(COOKIE_STORAGE_KEYS.noticeDismissed) === "1";
}

export function dismissCookieNotice(): void {
  writeCookie(COOKIE_STORAGE_KEYS.noticeDismissed, "1", ONE_YEAR_SEC);
}

function clearAnalyticsSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANALYTICS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function notifyConsentUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT));
}

export function persistConsent(
  categories: CookieConsentCategories,
): StoredCookieConsent {
  const stored: StoredCookieConsent = {
    version: COOKIE_POLICY_VERSION,
    categories: { essential: true, analytics: categories.analytics },
    updatedAt: new Date().toISOString(),
  };
  writeCookie(COOKIE_STORAGE_KEYS.consent, JSON.stringify(stored), ONE_YEAR_SEC);
  dismissCookieNotice();
  if (!categories.analytics) {
    clearAnalyticsSessionId();
  }
  notifyConsentUpdated();
  return stored;
}

export function acceptAllCookies(): StoredCookieConsent {
  return persistConsent({ essential: true, analytics: true });
}

export function rejectNonEssentialCookies(): StoredCookieConsent {
  return persistConsent({ essential: true, analytics: false });
}

export function shouldShowCookieNotice(): boolean {
  if (typeof window === "undefined") return false;
  if (getStoredConsent()) return false;
  return !isNoticeDismissed();
}
