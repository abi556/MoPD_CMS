import { Badge } from "@/components/ui/badge";

export type ComplaintStatus =
  | "SUBMITTED"
  | "TRIAGE"
  | "ASSIGNED"
  | "IN_INVESTIGATION"
  | "DRAFT_RESPONSE"
  | "QA_LEGAL_REVIEW"
  | "RESPONSE_ISSUED"
  | "AWAITING_FEEDBACK"
  | "APPEAL"
  | "CLOSED";

export type SlaState = "on_track" | "at_risk" | "breached" | "unknown";

const STATUS_TONE: Record<ComplaintStatus, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  SUBMITTED: "neutral",
  TRIAGE: "warning",
  ASSIGNED: "brand",
  IN_INVESTIGATION: "brand",
  DRAFT_RESPONSE: "brand",
  QA_LEGAL_REVIEW: "warning",
  RESPONSE_ISSUED: "success",
  AWAITING_FEEDBACK: "neutral",
  APPEAL: "danger",
  CLOSED: "neutral",
};

const SLA_TONE: Record<SlaState, "neutral" | "success" | "warning" | "danger"> = {
  on_track: "success",
  at_risk: "warning",
  breached: "danger",
  unknown: "neutral",
};

export function getStatusTone(
  status: ComplaintStatus,
): "neutral" | "brand" | "success" | "warning" | "danger" {
  return STATUS_TONE[status] ?? "neutral";
}

export function getSlaTone(
  state: SlaState,
): "neutral" | "success" | "warning" | "danger" {
  return SLA_TONE[state] ?? "neutral";
}

export function formatStatusLabel(status: ComplaintStatus): string {
  return status.replace(/_/g, " ");
}

export function StatusBadge({
  status,
  className = "",
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  return (
    <Badge tone={getStatusTone(status)} className={className}>
      {formatStatusLabel(status)}
    </Badge>
  );
}

export function SlaBadge({
  state,
  label,
  className = "",
}: {
  state: SlaState;
  label?: string;
  className?: string;
}) {
  const defaultLabel =
    state === "on_track"
      ? "On track"
      : state === "at_risk"
        ? "At risk"
        : state === "breached"
          ? "Breached"
          : "SLA";

  return (
    <Badge tone={getSlaTone(state)} className={className}>
      {label ?? defaultLabel}
    </Badge>
  );
}
