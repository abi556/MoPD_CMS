import { test, expect } from "@playwright/test";

test("public home loads in English", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("locale switch to Amharic", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "am", exact: true }).click();
  await expect(page).toHaveURL(/\/am$/);
});

test("login page renders", async ({ page }) => {
  await page.goto("/en/auth/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
