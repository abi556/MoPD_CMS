import { test, expect } from "@playwright/test";

test.describe("Melhiq chatbot widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/chatbot/message", async (route) => {
      const body = (await route.request().postDataJSON()) as {
        message: string;
      };
      const confidence =
        body.message.toLowerCase().includes("hours") ? "guidance_only" : "verified";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            reply:
              confidence === "verified"
                ? "You can track complaints with your reference number."
                : "Office hours vary by office. This is general guidance only.",
            confidence,
            sources:
              confidence === "verified"
                ? [{ title: "Track FAQ", slug: "faq-track", url: "/faq" }]
                : [],
            sessionId: "e2e-session",
            turnCount: 1,
            disclaimer:
              confidence === "guidance_only"
                ? "General guidance only — not an official decision."
                : undefined,
          },
        }),
      });
    });
  });

  test("opens widget and shows verified response with sources", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: /open melhiq/i }).click();
    await page.getByLabel(/message to melhiq/i).fill("How do I track?");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/track complaints with your reference/i)).toBeVisible();
    await expect(page.getByText(/verified from official/i)).toBeVisible();
  });

  test("guidance_only shows amber disclaimer banner", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: /open melhiq/i }).click();
    await page.getByLabel(/message to melhiq/i).fill("office hours");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/general guidance/i).first()).toBeVisible();
  });

  test("quick links navigate to FAQ", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: /open melhiq/i }).click();
    await page.getByRole("link", { name: /read faq/i }).click();
    await expect(page).toHaveURL(/\/en\/faq/);
  });

  test("mobile viewport uses full-screen panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    await page.getByRole("button", { name: /open melhiq/i }).click();
    const panel = page.locator("#mopd-chat-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box?.width).toBeGreaterThan(350);
  });
});
