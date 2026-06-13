import { test, expect } from "@playwright/test";

test.describe("complaints oversight roles", () => {
  test("redirects unauthenticated users from complaints queue", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/complaints");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });
});
