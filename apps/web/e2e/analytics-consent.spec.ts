import { test, expect } from "@playwright/test";
import {
  denyAnalyticsConsent,
  eventTypesFromPayloads,
  grantAnalyticsConsent,
  installAnalyticsCapture,
  resetPublicConsentState,
  waitForAnalyticsFlush,
} from "./fixtures/analytics-consent";

test.describe("first-party analytics consent", () => {
  test.beforeEach(async ({ page }) => {
    await resetPublicConsentState(page);
  });

  test("does not call analytics API when analytics consent is denied", async ({
    page,
  }) => {
    const { payloads } = await installAnalyticsCapture(page);
    await denyAnalyticsConsent(page);

    await page.goto("/en/privacy");
    await page.goto("/en/cookies");
    await waitForAnalyticsFlush(page);

    expect(payloads).toHaveLength(0);
  });

  test("sends page.view after analytics consent is granted", async ({
    page,
  }) => {
    const { payloads } = await installAnalyticsCapture(page);
    await grantAnalyticsConsent(page);

    await page.goto("/en");
    await waitForAnalyticsFlush(page);
    await page.goto("/en/cookies");
    await waitForAnalyticsFlush(page);

    const eventTypes = eventTypesFromPayloads(payloads);
    expect(eventTypes).toContain("page.view");
    expect(
      payloads.some((payload) => payload.sessionId === "e2e-analytics-session"),
    ).toBe(true);
  });

  test("accept all on cookie banner enables analytics tracking", async ({
    page,
  }) => {
    const { payloads } = await installAnalyticsCapture(page);

    await page.goto("/en");
    const banner = page.getByRole("dialog", { name: /cookies on this service/i });
    await expect(banner).toBeVisible();
    await page.getByRole("button", { name: "Accept all" }).click();
    await expect(banner).toBeHidden();

    await page.goto("/en/privacy");
    await waitForAnalyticsFlush(page);

    expect(eventTypesFromPayloads(payloads)).toContain("page.view");
  });

  test("reject non-essential on cookie banner blocks analytics calls", async ({
    page,
  }) => {
    const { payloads } = await installAnalyticsCapture(page);

    await page.goto("/en");
    await page.getByRole("button", { name: "Reject non-essential" }).click();
    await page.goto("/en/privacy");
    await waitForAnalyticsFlush(page);

    expect(payloads).toHaveLength(0);
  });

  test("cookies policy page documents first-party analytics", async ({ page }) => {
    await page.goto("/en/cookies");
    await expect(
      page.getByText(/first-party usage analytics/i),
    ).toBeVisible();
    await expect(
      page.getByText(/only if you opt in/i),
    ).toBeVisible();
  });
});

test.describe("complaint funnel analytics", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await resetPublicConsentState(page);
    await grantAnalyticsConsent(page);
  });

  test("records funnel.start when opening complaint submit wizard", async ({
    page,
  }) => {
    const { payloads } = await installAnalyticsCapture(page);

    await page.route("**/api/v1/complaints/form-options", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            categories: [
              {
                id: "cat-analytics",
                code: "SERVICE",
                nameEn: "Service delivery",
                nameAm: null,
              },
            ],
            orgUnits: [],
          },
        }),
      });
    });

    await page.goto("/en/complaints/new");
    await expect(
      page.getByRole("heading", { name: /category & details/i }),
    ).toBeVisible({ timeout: 15_000 });
    await waitForAnalyticsFlush(page);

    const eventTypes = eventTypesFromPayloads(payloads);
    expect(eventTypes).toContain("funnel.start");
    expect(eventTypes).toContain("funnel.step_view");
    expect(eventTypes).toContain("page.view");
  });

  test("records funnel.step_complete when advancing wizard step", async ({
    page,
  }) => {
    const { payloads } = await installAnalyticsCapture(page);

    await page.route("**/api/v1/complaints/form-options", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            categories: [
              {
                id: "cat-analytics",
                code: "SERVICE",
                nameEn: "Service delivery",
                nameAm: null,
              },
            ],
            orgUnits: [],
          },
        }),
      });
    });

    await page.goto("/en/complaints/new");
    await page.locator("#subject").fill("Road repair delay in zone 3");
    await page
      .locator("#description")
      .fill(
        "The road expansion project has been incomplete for several months without updates.",
      );
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /step 2/i }),
    ).toBeVisible();
    await waitForAnalyticsFlush(page);

    expect(eventTypesFromPayloads(payloads)).toContain("funnel.step_complete");
  });
});
