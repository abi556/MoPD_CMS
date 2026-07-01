import { describe, expect, it } from "vitest";
import {
  canAppeal,
  canApproveQa,
  canEditResponseDraft,
  canEscalate,
  canReturnForRevision,
  canViewResponseDraft,
  isComplaintReadOnlyUser,
  showGenericTransition,
} from "./complaint-actions";

const OFFICER = [
  "complaint:read:own",
  "complaint:assign:self",
  "complaint:investigate",
  "complaint:escalate",
  "case:read",
  "case:write",
  "complaint:update",
];

const REVIEWER = [
  "complaint:read",
  "complaint:review",
  "complaint:approve",
  "workflow:transition",
  "complaints:transition",
];

const OMBUDSPERSON = [
  "complaint:read",
  "complaint:escalate",
  "complaints:list",
  "complaints:detail",
  "complaints:history",
  "audit:read",
  "report:view",
];

const OBSERVER = [
  "complaint:read",
  "report:view",
  "complaints:list",
  "complaints:detail",
  "complaints:history",
];

describe("complaint-actions", () => {
  it("canEscalate for ombudsperson and officer", () => {
    expect(canEscalate(OMBUDSPERSON)).toBe(true);
    expect(canEscalate(OFFICER)).toBe(true);
    expect(canEscalate(OBSERVER)).toBe(false);
  });

  it("canAppeal only on AWAITING_FEEDBACK with escalate permission", () => {
    expect(canAppeal("AWAITING_FEEDBACK", OMBUDSPERSON)).toBe(true);
    expect(canAppeal("ASSIGNED", OMBUDSPERSON)).toBe(false);
    expect(canAppeal("AWAITING_FEEDBACK", OBSERVER)).toBe(false);
  });

  it("QA approve/return for reviewer", () => {
    expect(canApproveQa("QA_LEGAL_REVIEW", REVIEWER)).toBe(true);
    expect(canReturnForRevision("QA_LEGAL_REVIEW", REVIEWER)).toBe(true);
    expect(canApproveQa("ASSIGNED", REVIEWER)).toBe(false);
    expect(showGenericTransition("QA_LEGAL_REVIEW", REVIEWER)).toBe(false);
  });

  it("officer uses generic transition not QA buttons", () => {
    expect(canApproveQa("QA_LEGAL_REVIEW", OFFICER)).toBe(false);
    expect(
      showGenericTransition("ASSIGNED", OFFICER, {
        userId: "officer-1",
        assignedToUserId: "officer-1",
      }),
    ).toBe(true);
  });

  it("ombudsperson has no generic workflow transitions", () => {
    expect(showGenericTransition("ASSIGNED", OMBUDSPERSON)).toBe(false);
    expect(canEscalate(OMBUDSPERSON)).toBe(true);
  });

  it("ReadOnlyObserver is read-only", () => {
    expect(isComplaintReadOnlyUser(OBSERVER)).toBe(true);
    expect(isComplaintReadOnlyUser(OFFICER)).toBe(false);
    expect(isComplaintReadOnlyUser(OMBUDSPERSON)).toBe(false);
  });

  it("response draft edit/view by status and role", () => {
    expect(canEditResponseDraft("DRAFT_RESPONSE", OFFICER)).toBe(true);
    expect(canEditResponseDraft("IN_INVESTIGATION", OFFICER)).toBe(true);
    expect(canEditResponseDraft("QA_LEGAL_REVIEW", OFFICER)).toBe(false);
    expect(canEditResponseDraft("DRAFT_RESPONSE", REVIEWER)).toBe(false);
    expect(canViewResponseDraft("QA_LEGAL_REVIEW")).toBe(true);
    expect(canViewResponseDraft("TRIAGE")).toBe(false);
  });
});
