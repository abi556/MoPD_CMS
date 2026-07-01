import type { Page, Route } from "@playwright/test";

export type CapturedAnalyticsPayload = {
  sessionId: string;
  events: Array<{ eventType: string; [key: string]: unknown }>;
};

export async function installAnalyticsCapture(page: Page): Promise<{
  payloads: CapturedAnalyticsPayload[];
}> {
  const payloads: CapturedAnalyticsPayload[] = [];

  await page.route("**/api/v1/analytics/events", async (route: Route) => {
    payloads.push(route.request().postDataJSON() as CapturedAnalyticsPayload);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: { recorded: 1 } }),
    });
  });

  return { payloads };
}

export async function grantAnalyticsConsent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const consent = {
      version: "2026-06-01",
      categories: { essential: true, analytics: true },
      updatedAt: new Date().toISOString(),
    };
    document.cookie = `mopd_cookie_consent=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = "mopd_cookie_notice_dismissed=1; path=/; max-age=31536000; samesite=lax";
    localStorage.setItem("mopd_analytics_sid", "e2e-analytics-session");
  });
}

export async function denyAnalyticsConsent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const consent = {
      version: "2026-06-01",
      categories: { essential: true, analytics: false },
      updatedAt: new Date().toISOString(),
    };
    document.cookie = `mopd_cookie_consent=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = "mopd_cookie_notice_dismissed=1; path=/; max-age=31536000; samesite=lax";
    localStorage.removeItem("mopd_analytics_sid");
  });
}

export async function resetPublicConsentState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/en");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export function eventTypesFromPayloads(
  payloads: CapturedAnalyticsPayload[],
): string[] {
  return payloads.flatMap((payload) =>
    payload.events.map((event) => event.eventType),
  );
}

export async function waitForAnalyticsFlush(page: Page): Promise<void> {
  await page.waitForTimeout(2500);
}
