import { hasPermission } from "@/lib/permissions";
import type { ComplaintStatus } from "@/components/ui/status-badge";
import {
  canAssign,
  canAssignFromStatus,
  getAllowedTransitions,
} from "@/lib/staff/workflow-transitions";

export { canAssign, canAssignFromStatus, getAllowedTransitions };

export function canEscalate(permissions: readonly string[]): boolean {
  return hasPermission(permissions, "complaint:escalate");
}

export function canAppeal(
  status: ComplaintStatus,
  permissions: readonly string[],
): boolean {
  return status === "AWAITING_FEEDBACK" && canEscalate(permissions);
}

export function canApproveQa(
  status: ComplaintStatus,
  permissions: readonly string[],
): boolean {
  return (
    status === "QA_LEGAL_REVIEW" &&
    hasPermission(permissions, "complaint:approve")
  );
}

export function canReturnForRevision(
  status: ComplaintStatus,
  permissions: readonly string[],
): boolean {
  return (
    status === "QA_LEGAL_REVIEW" &&
    (hasPermission(permissions, "complaint:review") ||
      hasPermission(permissions, "complaint:approve"))
  );
}

/** Generic transition button — QA review uses dedicated approve/return actions. */
export function showGenericTransition(
  status: ComplaintStatus,
  permissions: readonly string[],
): boolean {
  if (status === "QA_LEGAL_REVIEW") {
    return false;
  }
  return getAllowedTransitions(status, permissions).length > 0;
}

const RESPONSE_DRAFT_EDIT_STATUSES: ComplaintStatus[] = [
  "IN_INVESTIGATION",
  "DRAFT_RESPONSE",
];

export function canEditResponseDraft(
  status: ComplaintStatus,
  permissions: readonly string[],
): boolean {
  return (
    hasPermission(permissions, "complaint:update") &&
    RESPONSE_DRAFT_EDIT_STATUSES.includes(status)
  );
}

export function canViewResponseDraft(status: ComplaintStatus): boolean {
  return (
    RESPONSE_DRAFT_EDIT_STATUSES.includes(status) ||
    status === "QA_LEGAL_REVIEW" ||
    status === "RESPONSE_ISSUED"
  );
}

export function isComplaintReadOnlyUser(permissions: readonly string[]): boolean {
  const canRead =
    hasPermission(permissions, "complaint:read") ||
    hasPermission(permissions, "complaint:read:own");
  if (!canRead) {
    return false;
  }
  const actionPermissions = [
    "workflow:transition",
    "complaints:assign",
    "complaint:escalate",
    "complaint:update",
    "case:write",
  ] as const;
  return !actionPermissions.some((code) => hasPermission(permissions, code));
}
