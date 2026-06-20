import { test, expect } from "@playwright/test";
import { createAxeBuilder } from "./fixtures/axe-test";
import { mockStaffSession } from "./fixtures/role-session";

test.describe("critical page accessibility", () => {
  test("login page has no serious axe violations", async ({ page }) => {
    await page.goto("/en/auth/login");
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("complaints queue has no serious axe violations", async ({ page }) => {
    await mockStaffSession(page);
    await page.route("**/api/v1/complaints**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }),
      });
    });
    await page.goto("/en/dashboard/complaints");
    await expect(
      page.getByRole("navigation", { name: "Staff navigation" }),
    ).toBeVisible({ timeout: 15_000 });
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("admin users page has no serious axe violations", async ({ page }) => {
    await mockStaffSession(page);
    await page.route("**/api/v1/users**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }),
      });
    });
    await page.goto("/en/dashboard/admin/users");
    await expect(
      page.getByRole("navigation", { name: "Staff navigation" }),
    ).toBeVisible({ timeout: 15_000 });
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("reports volume page has no serious axe violations", async ({ page }) => {
    await mockStaffSession(page);
    await page.route("**/api/v1/reports/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { buckets: [], total: 0 } }),
      });
    });
    await page.goto("/en/dashboard/reports/volume");
    await expect(
      page.getByRole("navigation", { name: "Staff navigation" }),
    ).toBeVisible({ timeout: 15_000 });
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });
});
