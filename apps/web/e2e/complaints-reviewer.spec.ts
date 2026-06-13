import { test, expect } from "@playwright/test";

test.describe("reviewer post-login", () => {
  test("login routes ReviewerApprover to QA queue filter", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByLabel(/email/i).fill("reviewer@mopd.local");
    await page.getByLabel(/password/i).fill("ReviewerPass123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/complaints\?status=QA_LEGAL_REVIEW/);
  });
});
