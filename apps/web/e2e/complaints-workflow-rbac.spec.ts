import { test, expect } from "@playwright/test";
import { mockStaffSession, sessionUserForRole } from "./fixtures/role-session";

const COMPLAINT_ID = "cm-workflow-rbac-e2e";

function complaintDetail(status: string, assignedToUserId: string | null = null) {
  return {
    id: COMPLAINT_ID,
    referenceNo: "REF-WF-RBAC-001",
    status,
    channel: "WEB",
    subject: "Workflow RBAC fixture",
    description: "E2E fixture for role-separated workflow actions.",
    submittedAt: "2026-06-01T10:00:00.000Z",
    locale: "EN",
    consentGiven: true,
    categoryId: null,
    orgUnitId: null,
    complainantName: null,
    complainantEmail: null,
    complainantPhone: null,
    assignedToUserId,
    assignedByUserId: assignedToUserId ? "user-ComplaintsAdmin" : null,
    assignedAt: assignedToUserId ? "2026-06-01T11:00:00.000Z" : null,
    assignmentReason: null,
    lastTransitionByUserId: null,
    lastTransitionAt: null,
    responseDraft: null,
    priority: "NORMAL",
  };
}

async function mockComplaintDetailPage(
  page: import("@playwright/test").Page,
  role: string,
  status: string,
  assignedToUserId: string | null = null,
) {
  const user = sessionUserForRole(role);
  await mockStaffSession(page, role);

  await page.route(`**/api/v1/complaints/${COMPLAINT_ID}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: complaintDetail(status, assignedToUserId) }),
    });
  });

  await page.route(`**/api/v1/complaints/${COMPLAINT_ID}/history`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route(`**/api/v1/complaints/${COMPLAINT_ID}/sla`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          complaintId: COMPLAINT_ID,
          state: "ON_TRACK",
          dueAt: "2026-06-15T10:00:00.000Z",
          remainingMs: 86400000,
        },
      }),
    });
  });

  return user;
}

test.describe("complaint workflow RBAC (UI gating)", () => {
  test("complaints admin sees Assign on unassigned triage", async ({ page }) => {
    await mockComplaintDetailPage(page, "ComplaintsAdmin", "TRIAGE", null);
    await page.goto(`/en/dashboard/complaints/${COMPLAINT_ID}`);
    await expect(page.getByRole("button", { name: /^assign$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^transition$/i })).toHaveCount(0);
  });

  test("case officer self-assigns from unassigned triage", async ({ page }) => {
    const user = await mockComplaintDetailPage(page, "CaseOfficer", "TRIAGE", null);
    await page.goto(`/en/dashboard/complaints/${COMPLAINT_ID}`);
    await expect(page.getByRole("button", { name: /^assign$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^transition$/i })).toHaveCount(0);
    await page.getByRole("button", { name: /^assign$/i }).click();
    await expect(page.getByText(/pick up this unassigned case/i)).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test("reviewer cannot assign or transition triage cases", async ({ page }) => {
    await mockComplaintDetailPage(page, "ReviewerApprover", "TRIAGE", null);
    await page.goto(`/en/dashboard/complaints/${COMPLAINT_ID}`);
    await expect(page.getByRole("button", { name: /^assign$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^transition$/i })).toHaveCount(0);
  });

  test("assigned officer sees Transition on ASSIGNED", async ({ page }) => {
    const user = await mockComplaintDetailPage(
      page,
      "CaseOfficer",
      "ASSIGNED",
      "user-CaseOfficer",
    );
    await page.goto(`/en/dashboard/complaints/${COMPLAINT_ID}`);
    await expect(page.getByRole("button", { name: /^transition$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^assign$/i })).toHaveCount(0);
    expect(user.id).toBe("user-CaseOfficer");
  });

  test("officer cannot close awaiting feedback cases", async ({ page }) => {
    await mockComplaintDetailPage(
      page,
      "CaseOfficer",
      "AWAITING_FEEDBACK",
      "user-CaseOfficer",
    );
    await page.goto(`/en/dashboard/complaints/${COMPLAINT_ID}`);
    await expect(page.getByRole("button", { name: /^transition$/i })).toHaveCount(0);
  });

  test("complaints admin can close awaiting feedback cases", async ({ page }) => {
    await mockComplaintDetailPage(
      page,
      "ComplaintsAdmin",
      "AWAITING_FEEDBACK",
      "user-CaseOfficer",
    );
    await page.goto(`/en/dashboard/complaints/${COMPLAINT_ID}`);
    await expect(page.getByRole("button", { name: /^transition$/i })).toBeVisible();
  });
});
