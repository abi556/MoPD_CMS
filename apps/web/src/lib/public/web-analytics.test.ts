import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/public/cookie-consent", () => ({
  hasAnalyticsConsent: vi.fn(() => false),
}));

vi.mock("@/lib/public/web-analytics-api", () => ({
  sendAnalyticsEvents: vi.fn().mockResolvedValue(undefined),
}));

import { hasAnalyticsConsent } from "@/lib/public/cookie-consent";
import { sendAnalyticsEvents } from "@/lib/public/web-analytics-api";
import {
  COMPLAINT_SUBMIT_FUNNEL,
  clearAnalyticsSessionId,
  detectDeviceClass,
  detectReferrerCategory,
  flushAnalyticsQueue,
  getAnalyticsSessionId,
  resetWebAnalyticsForTests,
  sanitizeClientPagePath,
  trackAnalyticsEvent,
  trackPageView,
  wizardStepName,
} from "@/lib/public/web-analytics";

describe("web-analytics", () => {
  beforeEach(() => {
    resetWebAnalyticsForTests();
    vi.mocked(hasAnalyticsConsent).mockReturnValue(false);
    vi.mocked(sendAnalyticsEvents).mockClear();
    vi.stubGlobal("location", {
      pathname: "/en/cookies",
      protocol: "http:",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sanitizes query strings from page paths", () => {
    expect(sanitizeClientPagePath("/en/track?ref=secret")).toBe("/en/track");
    expect(sanitizeClientPagePath("/en/faq#section")).toBe("/en/faq");
  });

  it("maps wizard steps to stable funnel names", () => {
    expect(wizardStepName(1)).toBe("details");
    expect(wizardStepName(2)).toBe("contact");
    expect(wizardStepName(3)).toBe("review");
  });

  it("detects coarse device class from user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    expect(detectDeviceClass()).toBe("mobile");
  });

  it("does not queue events without analytics consent", () => {
    trackPageView("/en", "en");
    expect(sendAnalyticsEvents).not.toHaveBeenCalled();
  });

  it("queues and flushes page.view when consent is granted", async () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(true);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "test-session"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    trackPageView("/en/privacy", "en");
    await flushAnalyticsQueue();

    expect(sendAnalyticsEvents).toHaveBeenCalledWith("test-session", [
      expect.objectContaining({
        eventType: "page.view",
        pagePath: "/en/privacy",
        locale: "en",
      }),
    ]);
  });

  it("records complaint funnel metadata shape", async () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(true);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "funnel-session"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    trackAnalyticsEvent({
      eventType: "funnel.start",
      funnelName: COMPLAINT_SUBMIT_FUNNEL,
      locale: "en",
    });
    await flushAnalyticsQueue();

    expect(sendAnalyticsEvents).toHaveBeenCalledWith(
      "funnel-session",
      [
        expect.objectContaining({
          eventType: "funnel.start",
          funnelName: COMPLAINT_SUBMIT_FUNNEL,
        }),
      ],
    );
  });

  it("debounces flush with a timer", async () => {
    vi.useFakeTimers();
    vi.mocked(hasAnalyticsConsent).mockReturnValue(true);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "debounce-session"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    trackPageView("/en", "en");
    expect(sendAnalyticsEvents).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(sendAnalyticsEvents).toHaveBeenCalledTimes(1);
  });

  it("detects tablet and desktop device classes", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
    });
    expect(detectDeviceClass()).toBe("tablet");

    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
    expect(detectDeviceClass()).toBe("desktop");
  });

  it("classifies referrer categories", () => {
    vi.stubGlobal("location", { hostname: "mopd.example.gov", protocol: "https:" });

    vi.stubGlobal("document", { referrer: "" });
    expect(detectReferrerCategory()).toBe("direct");

    vi.stubGlobal("document", { referrer: "https://www.google.com/search?q=mopd" });
    expect(detectReferrerCategory()).toBe("search");

    vi.stubGlobal("document", { referrer: "https://www.facebook.com/post/1" });
    expect(detectReferrerCategory()).toBe("social");

    vi.stubGlobal("document", { referrer: "https://news.example.com/article" });
    expect(detectReferrerCategory()).toBe("referral");

    vi.stubGlobal("document", { referrer: "https://mopd.example.gov/en" });
    expect(detectReferrerCategory()).toBe("direct");

    vi.stubGlobal("document", { referrer: "not-a-valid-url" });
    expect(detectReferrerCategory()).toBe("referral");
  });

  it("creates and clears analytics session id when consent is granted", () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(true);
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });

    const sessionId = getAnalyticsSessionId();
    expect(sessionId).toBeTruthy();
    expect(getAnalyticsSessionId()).toBe(sessionId);

    clearAnalyticsSessionId();
    const newSessionId = getAnalyticsSessionId();
    expect(newSessionId).toBeTruthy();
    expect(newSessionId).not.toBe(sessionId);
  });

  it("returns null session id without consent", () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(false);
    expect(getAnalyticsSessionId()).toBeNull();
  });

  it("falls back when localStorage throws on read", () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(true);
    const randomUuid = vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: vi.fn(),
    });

    expect(getAnalyticsSessionId()).toBe("00000000-0000-4000-8000-000000000001");
    randomUuid.mockRestore();
  });

  it("does not flush an empty queue", async () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(true);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "session-only"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    await flushAnalyticsQueue();
    expect(sendAnalyticsEvents).not.toHaveBeenCalled();
  });

  it("does not flush when consent is denied", async () => {
    vi.mocked(hasAnalyticsConsent).mockReturnValue(false);
    trackPageView("/en", "en");
    await flushAnalyticsQueue();
    expect(sendAnalyticsEvents).not.toHaveBeenCalled();
  });
});
