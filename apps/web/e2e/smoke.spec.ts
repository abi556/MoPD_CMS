import { test, expect } from "@playwright/test";

test("public home loads in English", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("locale switch to Amharic", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByText("Submit a complaint, receive a reference number"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Switch to Amharic" }).click();
  await expect(page).toHaveURL(/\/am$/);
  await expect(
    page.getByText("ቅሬታ ያስገቡ፣ የመከታተያ ቁጥር ይቀበሉ"),
  ).toBeVisible();
});

test("login page renders", async ({ page }) => {
  await page.goto("/en/auth/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
