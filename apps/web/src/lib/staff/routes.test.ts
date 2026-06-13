import { describe, expect, it } from "vitest";
import { staffPath, staffPathWithQuery, staffRoutes } from "./routes";

describe("staffRoutes", () => {
  it("defines core staff paths without locale prefix", () => {
    expect(staffRoutes.home).toBe("/dashboard");
    expect(staffRoutes.complaints).toBe("/dashboard/complaints");
    expect(staffRoutes.complaintDetail("abc")).toBe("/dashboard/complaints/abc");
    expect(staffRoutes.recoveryInquiries).toBe("/dashboard/recovery-inquiries");
    expect(staffRoutes.reports.root).toBe("/dashboard/reports");
    expect(staffRoutes.reports.volume).toBe("/dashboard/reports/volume");
    expect(staffRoutes.admin.users).toBe("/dashboard/admin/users");
    expect(staffRoutes.notifications).toBe("/dashboard/notifications");
    expect(staffRoutes.auth.login).toBe("/auth/login");
  });

  it("staffPath returns path unchanged when no base configured", () => {
    expect(staffPath("/dashboard")).toBe("/dashboard");
  });

  it("staffPathWithQuery appends query params", () => {
    expect(
      staffPathWithQuery(staffRoutes.complaints, { status: "TRIAGE" }),
    ).toBe("/dashboard/complaints?status=TRIAGE");
  });
});
