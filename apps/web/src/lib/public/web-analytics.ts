import { hasAnalyticsConsent } from "@/lib/public/cookie-consent";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_SESSION_KEY,
} from "@/lib/public/web-analytics-constants";

export { ANALYTICS_CONSENT_EVENT, ANALYTICS_SESSION_KEY };

export const WEB_ANALYTICS_EVENT_TYPES = [
  "page.view",
  "funnel.start",
  "funnel.step_view",
  "funnel.step_complete",
  "funnel.submit_start",
  "funnel.submit_success",
  "funnel.submit_error",
  "funnel.evidence_open",
  "funnel.evidence_complete",
  "funnel.abandon",
  "contact.submit_success",
  "chat.open",
  "chat.message_sent",
  "chat.quick_action",
  "track.search_success",
  "track.search_not_found",
] as const;

export type WebAnalyticsEventType = (typeof WEB_ANALYTICS_EVENT_TYPES)[number];

export type DeviceClass = "mobile" | "tablet" | "desktop";
export type ReferrerCategory = "direct" | "search" | "social" | "referral";

export interface WebAnalyticsEventInput {
  eventType: WebAnalyticsEventType;
  pagePath?: string;
  locale?: "en" | "am";
  funnelName?: string;
  funnelStep?: string;
  funnelPhase?: string;
  deviceClass?: DeviceClass;
  referrerCategory?: ReferrerCategory;
  metadata?: Record<string, string | number | boolean>;
}

const queue: WebAnalyticsEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Test-only reset for isolated vitest runs. */
export function resetWebAnalyticsForTests(): void {
  queue.length = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function randomSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsSessionId(): string | null {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) {
    return null;
  }
  try {
    const existing = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
    if (existing) return existing;
    const created = randomSessionId();
    window.localStorage.setItem(ANALYTICS_SESSION_KEY, created);
    return created;
  } catch {
    return randomSessionId();
  }
}

export function clearAnalyticsSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANALYTICS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function detectDeviceClass(): DeviceClass {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

export function detectReferrerCategory(): ReferrerCategory {
  if (typeof document === "undefined" || !document.referrer) {
    return "direct";
  }
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return "search";
    if (/facebook\.|twitter\.|x\.com|instagram\.|linkedin\./.test(host)) {
      return "social";
    }
    if (typeof window !== "undefined" && host === window.location.hostname) {
      return "direct";
    }
    return "referral";
  } catch {
    return "referral";
  }
}

export function sanitizeClientPagePath(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? path;
}

export function trackAnalyticsEvent(
  event: WebAnalyticsEventInput,
): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) {
    return;
  }

  queue.push({
    ...event,
    pagePath: event.pagePath
      ? sanitizeClientPagePath(event.pagePath)
      : sanitizeClientPagePath(window.location.pathname),
    deviceClass: event.deviceClass ?? detectDeviceClass(),
    referrerCategory: event.referrerCategory ?? detectReferrerCategory(),
  });

  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushAnalyticsQueue();
  }, 2000);
}

export async function flushAnalyticsQueue(): Promise<void> {
  if (typeof window === "undefined" || !hasAnalyticsConsent() || queue.length === 0) {
    return;
  }

  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;

  const batch = queue.splice(0, 20);
  const { sendAnalyticsEvents } = await import("@/lib/public/web-analytics-api");
  await sendAnalyticsEvents(sessionId, batch);
}

export function trackPageView(path: string, locale?: "en" | "am"): void {
  trackAnalyticsEvent({
    eventType: "page.view",
    pagePath: path,
    locale,
  });
}

export const COMPLAINT_SUBMIT_FUNNEL = "complaint_submit" as const;

export function wizardStepName(step: 1 | 2 | 3): string {
  if (step === 1) return "details";
  if (step === 2) return "contact";
  return "review";
}
