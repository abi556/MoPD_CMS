"use client";

import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getCurrentTimelineStepKey,
  getTrackProgressPercent,
  getTimelineStepStates,
  TRACK_TIMELINE_STEPS,
  type ComplaintTrackStatus,
} from "@/lib/complaint-track";

const RING_SIZE = 120;
const STROKE = 7;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ComplaintTrackProgressVisualProps =
  | { mode: "loading" }
  | { mode: "error" }
  | { mode: "progress"; status: ComplaintTrackStatus };

function ProgressRing({
  percent,
  tone,
  children,
}: {
  percent: number;
  tone: "brand" | "muted" | "danger";
  children: ReactNode;
}) {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const strokeClass =
    tone === "brand"
      ? "stroke-primary"
      : tone === "danger"
        ? "stroke-danger/60"
        : "stroke-border-standard";

  return (
    <div
      className="relative mx-auto"
      style={{ width: RING_SIZE, height: RING_SIZE }}
      role="img"
      aria-hidden
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        className="-rotate-90"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          className="stroke-surface-container-low"
          strokeWidth={STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          className={`${strokeClass} transition-[stroke-dashoffset] duration-700 ease-out`}
          strokeWidth={STROKE}
          strokeLinecap="square"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        {children}
      </div>
    </div>
  );
}

function StepDots({ status }: { status: ComplaintTrackStatus }) {
  const states = getTimelineStepStates(status);

  return (
    <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
      {states.map((state, i) => (
        <span
          key={TRACK_TIMELINE_STEPS[i].key}
          className={`transition-all duration-300 ${
            state === "completed"
              ? "h-1.5 w-1.5 bg-primary rounded-full"
              : state === "current"
                ? "h-2 w-2 bg-primary ring-2 ring-primary/20 rounded-full"
                : "h-1.5 w-1.5 bg-border-standard rounded-full"
          }`}
        />
      ))}
    </div>
  );
}

export function ComplaintTrackProgressVisual(
  props: ComplaintTrackProgressVisualProps,
) {
  const t = useTranslations("complaintTrack");

  if (props.mode === "loading") {
    return (
      <div className="flex w-full flex-col items-center py-2 animate-fade-in-up">
        <ProgressRing percent={35} tone="muted">
          <Loader2
            className="h-7 w-7 animate-spin text-primary"
            aria-hidden
          />
          <p className="mt-2 max-w-[200px] font-body-sm text-body-sm leading-snug text-text-secondary">
            {t("progress.loading")}
          </p>
        </ProgressRing>
      </div>
    );
  }

  if (props.mode === "error") {
    return (
      <div className="flex w-full flex-col items-center py-2 animate-fade-in-up">
        <ProgressRing percent={0} tone="danger">
          <AlertCircle className="h-7 w-7 text-danger" aria-hidden />
          <p className="mt-2 max-w-[200px] font-body-sm text-body-sm leading-snug text-text-secondary">
            {t("progress.errorHint")}
          </p>
        </ProgressRing>
      </div>
    );
  }

  const { status } = props;
  const percent = getTrackProgressPercent(status);
  const stepKey = getCurrentTimelineStepKey(status);
  const stepIndex =
    TRACK_TIMELINE_STEPS.findIndex((s) => s.key === stepKey) + 1;
  const stepTitle = t(`timeline.${stepKey}.title` as `timeline.received.title`);
  const statusLabel = t(`status.${status}` as "status.SUBMITTED");

  return (
    <div
      className="flex w-full flex-col items-center rounded-none border border-border-standard/80 bg-surface-container-low/50 px-3 py-4 animate-fade-in-up"
      aria-live="polite"
    >
      <p className="mb-2 font-overline text-overline uppercase text-text-secondary">
        {t("progress.label")}
      </p>
      <ProgressRing percent={percent} tone="brand">
        <span className="font-h3 text-h3 font-bold text-brand-deep">{percent}%</span>
        <span className="mt-0.5 font-body-sm text-body-sm text-text-secondary">
          {t("progress.stepOf", {
            current: stepIndex,
            total: TRACK_TIMELINE_STEPS.length,
          })}
        </span>
      </ProgressRing>
      <StepDots status={status} />
      <p className="mt-2 max-w-[220px] text-center font-body text-body-sm font-semibold text-on-surface">
        {stepTitle}
      </p>
      <p className="mt-0.5 font-body-sm text-body-sm text-text-secondary">
        {statusLabel}
      </p>
    </div>
  );
}
