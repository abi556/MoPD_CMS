import { test, expect } from "@playwright/test";
import { buildAppNav } from "../src/lib/navigation/build-app-nav";
import { staffRoutes } from "../src/lib/staff/routes";
import {
  E2E_ROLE_PERMISSIONS,
  mockStaffSession,
  sessionUserForRole,
  staffSidebarLink,
} from "./fixtures/role-session";

const ROLES = Object.keys(E2E_ROLE_PERMISSIONS);

test.describe("role nav matrix", () => {
  test.describe.configure({ mode: "serial" });

  for (const role of ROLES) {
    test(`${role} sidebar links match permission matrix`, async ({ page }) => {
      await mockStaffSession(page, role);
      await page.goto("/en/dashboard");
      await expect(
        page.getByRole("navigation", { name: "Staff navigation" }),
      ).toBeVisible({ timeout: 15_000 });

      const expected = buildAppNav(sessionUserForRole(role)).map((item) => item.href);

      for (const href of expected) {
        await expect(staffSidebarLink(page, href)).toBeVisible();
      }

      if (!expected.includes(staffRoutes.complaints)) {
        await expect(staffSidebarLink(page, staffRoutes.complaints)).toHaveCount(0);
      }
      if (!expected.includes(staffRoutes.admin.root)) {
        await expect(staffSidebarLink(page, staffRoutes.admin.root)).toHaveCount(0);
      }
    });
  }
});
