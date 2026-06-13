import { describe, expect, it } from "vitest";
import {
  canAssign,
  canAssignFromStatus,
  getAllowedTransitions,
} from "./workflow-transitions";

describe("workflow-transitions", () => {
  const officerPerms = [
    "complaint:read:own",
    "workflow:transition",
    "complaints:assign",
    "complaint:escalate",
  ];

  it("returns TRIAGE for SUBMITTED", () => {
    expect(getAllowedTransitions("SUBMITTED", officerPerms)).toEqual(["TRIAGE"]);
  });

  it("does not offer ASSIGNED from TRIAGE (use assign instead)", () => {
    expect(getAllowedTransitions("TRIAGE", officerPerms)).toEqual([]);
  });

  it("does not offer APPEAL from AWAITING_FEEDBACK (use appeal dialog)", () => {
    expect(
      getAllowedTransitions("AWAITING_FEEDBACK", officerPerms),
    ).not.toContain("APPEAL");
    expect(getAllowedTransitions("AWAITING_FEEDBACK", officerPerms)).toContain(
      "CLOSED",
    );
  });

  it("returns IN_INVESTIGATION from ASSIGNED", () => {
    expect(getAllowedTransitions("ASSIGNED", officerPerms)).toEqual([
      "IN_INVESTIGATION",
    ]);
  });

  it("allows assign from TRIAGE status", () => {
    expect(canAssignFromStatus("TRIAGE")).toBe(true);
    expect(canAssignFromStatus("ASSIGNED")).toBe(false);
  });

  it("canAssign with workflow:transition", () => {
    expect(canAssign(officerPerms)).toBe(true);
    expect(canAssign(["complaint:read"])).toBe(false);
  });

  it("blocks QA transition without complaint:review", () => {
    expect(
      getAllowedTransitions("DRAFT_RESPONSE", officerPerms),
    ).not.toContain("QA_LEGAL_REVIEW");
  });
});
