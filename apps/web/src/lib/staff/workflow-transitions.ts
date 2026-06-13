import { hasPermission } from "@/lib/permissions";
import type { ComplaintStatus } from "@/components/ui/status-badge";

const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ["TRIAGE"],
  TRIAGE: ["ASSIGNED"],
  ASSIGNED: ["IN_INVESTIGATION"],
  IN_INVESTIGATION: ["DRAFT_RESPONSE"],
  DRAFT_RESPONSE: ["QA_LEGAL_REVIEW"],
  QA_LEGAL_REVIEW: ["DRAFT_RESPONSE", "RESPONSE_ISSUED"],
  RESPONSE_ISSUED: ["AWAITING_FEEDBACK"],
  AWAITING_FEEDBACK: ["CLOSED", "APPEAL"],
  APPEAL: ["ASSIGNED"],
  CLOSED: [],
};

export function getAllowedTransitions(
  fromStatus: ComplaintStatus,
  permissions: readonly string[],
): ComplaintStatus[] {
  const candidates = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  return candidates.filter((toStatus) => {
    // ASSIGNED is reached via POST /assign (sets assignee); transition-only would lock out scoped officers.
    if (
      toStatus === "ASSIGNED" &&
      (fromStatus === "TRIAGE" || fromStatus === "APPEAL")
    ) {
      return false;
    }
    if (toStatus === "APPEAL" && fromStatus === "AWAITING_FEEDBACK") {
      return false;
    }
    return canTransition(fromStatus, toStatus, permissions);
  });
}

export function canTransition(
  fromStatus: ComplaintStatus,
  toStatus: ComplaintStatus,
  permissions: readonly string[],
): boolean {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) return false;

  if (toStatus === "QA_LEGAL_REVIEW") {
    return hasPermission(permissions, "complaint:review");
  }
  if (fromStatus === "QA_LEGAL_REVIEW" && toStatus === "RESPONSE_ISSUED") {
    return hasPermission(permissions, "complaint:approve");
  }
  if (toStatus === "APPEAL") {
    return hasPermission(permissions, "complaint:escalate");
  }
  if (
    toStatus === "ASSIGNED" ||
    fromStatus === "TRIAGE"
  ) {
    return (
      hasPermission(permissions, "workflow:transition") ||
      hasPermission(permissions, "complaints:transition") ||
      hasPermission(permissions, "complaints:assign")
    );
  }

  return hasPermission(permissions, "workflow:transition");
}

export function canAssign(permissions: readonly string[]): boolean {
  return (
    hasPermission(permissions, "workflow:transition") ||
    hasPermission(permissions, "complaints:assign")
  );
}

export function canAssignFromStatus(status: ComplaintStatus): boolean {
  return status === "TRIAGE" || status === "APPEAL";
}
