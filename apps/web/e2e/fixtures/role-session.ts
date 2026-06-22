import type { Page } from "@playwright/test";
import type { SessionUser } from "../../src/lib/auth/session-types";

export const E2E_ROLE_PERMISSIONS: Record<string, string[]> = {
  SuperAdmin: [
    "complaint:read",
    "complaint:recovery:manage",
    "report:view",
    "report:export",
    "audit:read",
    "user:manage",
    "role:manage",
    "config:manage",
    "sla:configure",
    "template:manage",
    "notification:manage",
    "admin:ping",
  ],
  SystemAdmin: [
    "user:manage",
    "role:manage",
    "config:manage",
    "sla:configure",
    "template:manage",
    "notification:manage",
    "admin:ping",
  ],
  ComplaintsAdmin: [
    "complaint:read",
    "complaint:triage",
    "complaint:assign",
    "complaint:close",
    "complaint:publish",
    "complaint:escalate",
    "complaint:update",
    "complaint:recovery:manage",
    "workflow:transition",
    "complaints:list",
    "complaints:detail",
    "complaints:history",
  ],
  CaseOfficer: [
    "complaint:read:own",
    "complaint:assign:self",
    "complaint:investigate",
    "complaint:escalate",
    "complaint:update",
    "case:read",
    "case:write",
    "document:upload",
    "document:read",
    "complaints:list",
    "complaints:detail",
    "complaints:history",
  ],
  ReviewerApprover: [
    "complaint:read",
    "complaint:review",
    "complaint:approve",
    "complaints:list",
    "complaints:detail",
    "complaints:history",
  ],
  CommunicationsOfficer: [
    "template:manage",
    "notification:manage",
    "knowledge:manage",
    "chatbot:analytics:read",
  ],
  Auditor: ["audit:read", "report:view", "report:export"],
  Ombudsperson: [
    "complaint:read",
    "complaint:escalate",
    "audit:read",
    "report:view",
  ],
  ReadOnlyObserver: ["complaint:read", "report:view"],
};

export function sessionUserForRole(role: string): SessionUser {
  return {
    id: `user-${role}`,
    email: `${role.toLowerCase()}@mopd.local`,
    roles: [role],
    permissions: E2E_ROLE_PERMISSIONS[role] ?? [],
    mfaEnrolled: true,
    mustChangePassword: false,
    mustEnrollMfa: false,
    requireMfaEnrollment: false,
    canSkipMfaEnroll: true,
  };
}

/** Mock authenticated staff session for Playwright (cookie + auth API routes). */
export async function mockStaffSession(page: Page, role = "SuperAdmin") {
  const user = sessionUserForRole(role);
  await page.context().addCookies([
    {
      name: "mopd_session_hint",
      value: "1",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { accessToken: "e2e-token", expiresIn: 3600 },
      }),
    });
  });
  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: user }),
    });
  });
}

/** Sidebar nav link (locale-prefixed hrefs). */
export function staffSidebarLink(page: Page, href: string) {
  return page
    .getByRole("navigation", { name: "Staff navigation" })
    .locator(`a[href$="${href}"]`)
    .first();
}
