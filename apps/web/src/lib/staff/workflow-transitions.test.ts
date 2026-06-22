import { describe, expect, it } from "vitest";
import {
  canAssign,
  canAssignFromStatus,
  canPickAssigneeUser,
  getAllowedTransitions,
} from "./workflow-transitions";

describe("workflow-transitions", () => {
  const officerPerms = [
    "complaint:read:own",
    "complaint:assign:self",
    "complaint:investigate",
    "complaint:escalate",
  ];

  const adminPerms = [
    "complaint:triage",
    "complaint:assign",
    "complaint:close",
    "complaint:publish",
    "complaint:escalate",
    "complaint:read",
  ];

  const reviewerPerms = ["complaint:read", "complaint:review", "complaint:approve"];

  it("returns TRIAGE for SUBMITTED only for triage permission", () => {
    expect(
      getAllowedTransitions("SUBMITTED", adminPerms, { userId: "admin-1" }),
    ).toEqual(["TRIAGE"]);
    expect(
      getAllowedTransitions("SUBMITTED", officerPerms, { userId: "officer-1" }),
    ).toEqual([]);
  });

  it("does not offer ASSIGNED from TRIAGE (use assign instead)", () => {
    expect(getAllowedTransitions("TRIAGE", adminPerms)).toEqual([]);
  });

  it("returns IN_INVESTIGATION from ASSIGNED for assignee officer", () => {
    expect(
      getAllowedTransitions("ASSIGNED", officerPerms, {
        userId: "officer-1",
        assignedToUserId: "officer-1",
      }),
    ).toEqual(["IN_INVESTIGATION"]);
  });

  it("blocks investigation when officer is not assignee", () => {
    expect(
      getAllowedTransitions("ASSIGNED", officerPerms, {
        userId: "officer-1",
        assignedToUserId: "other",
      }),
    ).toEqual([]);
  });

  it("allows assign from triage for admin and self-assign officer", () => {
    expect(
      canAssign(officerPerms, {
        userId: "officer-1",
        status: "TRIAGE",
        assignedToUserId: null,
      }),
    ).toBe(true);
    expect(
      canAssign(adminPerms, {
        userId: "admin-1",
        status: "TRIAGE",
        assignedToUserId: null,
      }),
    ).toBe(true);
    expect(canAssignFromStatus("TRIAGE")).toBe(true);
    expect(canPickAssigneeUser(adminPerms)).toBe(true);
    expect(canPickAssigneeUser(officerPerms)).toBe(false);
  });

  it("blocks officer close", () => {
    expect(
      getAllowedTransitions("AWAITING_FEEDBACK", officerPerms, {
        userId: "officer-1",
        assignedToUserId: "officer-1",
      }),
    ).not.toContain("CLOSED");
    expect(
      getAllowedTransitions("AWAITING_FEEDBACK", adminPerms, { userId: "admin-1" }),
    ).toContain("CLOSED");
  });

  it("allows reviewer QA transitions only", () => {
    expect(
      getAllowedTransitions("QA_LEGAL_REVIEW", reviewerPerms, {
        userId: "reviewer-1",
        assignedToUserId: "officer-1",
      }),
    ).toEqual(["DRAFT_RESPONSE", "RESPONSE_ISSUED"]);
  });
});
