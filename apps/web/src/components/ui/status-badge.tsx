"use client";

import { useTranslations } from "next-intl";

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

const STATUS_TONE: Record<
  ComplaintStatus,
  "neutral" | "brand" | "success" | "warning" | "danger"
> = {
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

const TONE_DOT: Record<
  "neutral" | "brand" | "success" | "warning" | "danger",
  string
> = {
  neutral: "bg-staff-text-muted/70",
  brand: "bg-staff-nav-active",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
};

const TONE_PILL: Record<
  "neutral" | "brand" | "success" | "warning" | "danger",
  string
> = {
  neutral: "border-staff-border/50 bg-staff-shell/70 text-staff-text-muted",
  brand: "border-staff-nav-active/20 bg-staff-nav-active-bg/12 text-staff-nav-active",
  success: "border-emerald-600/15 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  danger: "border-red-500/20 bg-red-500/10 text-red-800 dark:text-red-300",
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

/** Fallback when i18n is unavailable (tests, non-React). */
export function formatStatusLabel(status: ComplaintStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pillClassName(
  tone: keyof typeof TONE_PILL,
  size: "sm" | "md",
  className: string,
): string {
  const sizeClass =
    size === "md"
      ? "max-w-[11rem] px-2.5 py-1 text-xs"
      : "max-w-[8.5rem] px-2 py-0.5 text-[11px]";
  return [
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium leading-tight",
    sizeClass,
    TONE_PILL[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function StatusBadge({
  status,
  className = "",
  size = "sm",
}: {
  status: ComplaintStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("complaints.queue.statusLabels");
  const tone = getStatusTone(status);
  const label = t(status);

  return (
    <span
      className={pillClassName(tone, size, className)}
      title={label}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function SlaBadge({
  state,
  label,
  className = "",
  size = "sm",
}: {
  state: SlaState;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("complaints.sla");
  const tone = getSlaTone(state);
  const resolvedLabel =
    label ??
    (state === "on_track"
      ? t("onTrack")
      : state === "at_risk"
        ? t("atRisk")
        : state === "breached"
          ? t("breached")
          : t("unknown"));

  return (
    <span
      className={pillClassName(tone, size, className)}
      title={resolvedLabel}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`}
        aria-hidden
      />
      <span className="truncate">{resolvedLabel}</span>
    </span>
  );
}
