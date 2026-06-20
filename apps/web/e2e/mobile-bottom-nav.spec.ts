import { test, expect } from "@playwright/test";
import { mockStaffSession } from "./fixtures/role-session";

test.describe("mobile bottom nav", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("shows dashboard tab for CaseOfficer", async ({ page }) => {
    await mockStaffSession(page, "CaseOfficer");
    await page.goto("/en/dashboard");
    const mobileNav = page.getByRole("navigation", { name: /mobile staff/i });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /complaints/i })).toBeVisible();
  });

  test("hides complaints tab for SystemAdmin", async ({ page }) => {
    await mockStaffSession(page, "SystemAdmin");
    await page.goto("/en/dashboard");
    const mobileNav = page.getByRole("navigation", { name: /mobile staff/i });
    await expect(mobileNav.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /^complaints$/i })).toHaveCount(0);
  });

  test("opens More sheet", async ({ page }) => {
    await mockStaffSession(page, "SuperAdmin");
    await page.goto("/en/dashboard");
    const mobileNav = page.getByRole("navigation", { name: /mobile staff/i });
    await mobileNav.getByRole("button", { name: /^menu$/i }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /volume/i }).first()).toBeVisible();
  });
});
