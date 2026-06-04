export type ComplaintTrackStatus =
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

export interface ComplaintTrackResult {
  referenceNo: string;
  status: ComplaintTrackStatus;
  subject: string;
  submittedAt: string;
}

const STATUS_ORDER: ComplaintTrackStatus[] = [
  "SUBMITTED",
  "TRIAGE",
  "ASSIGNED",
  "IN_INVESTIGATION",
  "DRAFT_RESPONSE",
  "QA_LEGAL_REVIEW",
  "RESPONSE_ISSUED",
  "AWAITING_FEEDBACK",
  "APPEAL",
  "CLOSED",
];

export type TrackTimelineStepKey =
  | "received"
  | "review"
  | "investigation"
  | "response"
  | "closed";

export interface TrackTimelineStep {
  key: TrackTimelineStepKey;
  statuses: ComplaintTrackStatus[];
}

export const TRACK_TIMELINE_STEPS: TrackTimelineStep[] = [
  { key: "received", statuses: ["SUBMITTED"] },
  { key: "review", statuses: ["TRIAGE", "ASSIGNED"] },
  {
    key: "investigation",
    statuses: ["IN_INVESTIGATION", "DRAFT_RESPONSE", "QA_LEGAL_REVIEW"],
  },
  {
    key: "response",
    statuses: ["RESPONSE_ISSUED", "AWAITING_FEEDBACK", "APPEAL"],
  },
  { key: "closed", statuses: ["CLOSED"] },
];

export type TimelineStepState = "pending" | "current" | "completed";

export function normalizeReferenceInput(raw: string): string {
  return raw.trim().toUpperCase();
}

export function statusIndex(status: ComplaintTrackStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function getTimelineStepStates(
  status: ComplaintTrackStatus,
): TimelineStepState[] {
  const currentIdx = statusIndex(status);
  return TRACK_TIMELINE_STEPS.map((step) => {
    const stepIndices = step.statuses.map((s) => statusIndex(s));
    const minIdx = Math.min(...stepIndices);
    const maxIdx = Math.max(...stepIndices);
    if (currentIdx > maxIdx) return "completed";
    if (currentIdx >= minIdx && currentIdx <= maxIdx) return "current";
    return "pending";
  });
}

export function getCurrentTimelineStepKey(
  status: ComplaintTrackStatus,
): TrackTimelineStepKey {
  const states = getTimelineStepStates(status);
  const currentIdx = states.findIndex((s) => s === "current");
  if (currentIdx >= 0) {
    return TRACK_TIMELINE_STEPS[currentIdx].key;
  }
  return status === "CLOSED" ? "closed" : "received";
}

/** 0–100 progress for public track summary (maps to the 5 timeline milestones). */
export function getTrackProgressPercent(status: ComplaintTrackStatus): number {
  if (status === "CLOSED") return 100;
  const states = getTimelineStepStates(status);
  const completed = states.filter((s) => s === "completed").length;
  const hasCurrent = states.some((s) => s === "current");
  const total = TRACK_TIMELINE_STEPS.length;
  return Math.min(
    100,
    Math.round(((completed + (hasCurrent ? 0.5 : 0)) / total) * 100),
  );
}

/** Subtitle for a timeline row: status-specific when this step is current, else milestone summary. */
export function resolveTimelineStepBody(
  stepState: TimelineStepState,
  stepKey: TrackTimelineStepKey,
  status: ComplaintTrackStatus,
): { kind: "statusDetail"; status: ComplaintTrackStatus } | { kind: "milestone"; stepKey: TrackTimelineStepKey } {
  if (stepState === "current") {
    return { kind: "statusDetail", status };
  }
  return { kind: "milestone", stepKey };
}

export function statusBadgeTone(
  status: ComplaintTrackStatus,
): "neutral" | "brand" | "success" | "warning" | "danger" {
  if (status === "CLOSED") return "success";
  if (status === "APPEAL") return "warning";
  if (
    status === "IN_INVESTIGATION" ||
    status === "DRAFT_RESPONSE" ||
    status === "QA_LEGAL_REVIEW"
  ) {
    return "brand";
  }
  if (status === "RESPONSE_ISSUED" || status === "AWAITING_FEEDBACK") {
    return "success";
  }
  return "neutral";
}
