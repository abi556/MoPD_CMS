import { test, expect } from "@playwright/test";
import { mockStaffSession } from "./fixtures/role-session";

const COMPLAINT_ID = "cm-assisted-e2e-1";

test.describe("assisted complaint intake", () => {
  test("officer submits walk-in complaint and lands on case detail", async ({
    page,
  }) => {
    await mockStaffSession(page, "ComplaintsAdmin");

    await page.route("**/api/v1/complaints/form-options", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            categories: [
              {
                id: "cat-1",
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

    await page.route("**/api/v1/complaints", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(body.channel).toBe("ASSISTED");
      expect(body.consentGiven).toBe(true);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: { id: COMPLAINT_ID, referenceNo: "REF-ASSISTED-001" },
        }),
      });
    });

    await page.goto("/en/dashboard/complaints/new");

    await expect(
      page.getByRole("heading", { name: /assisted complaint intake/i }),
    ).toBeVisible();

    await page.getByLabel(/^subject$/i).fill("Delayed service at front desk");
    await page.getByLabel(/^description$/i).fill(
      "Citizen waited over two hours without being served at the regional office.",
    );
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /submit complaint/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/en/dashboard/complaints/${COMPLAINT_ID}$`),
    );
  });
});
