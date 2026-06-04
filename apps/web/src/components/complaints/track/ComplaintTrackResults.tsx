"use client";

import { Check, Circle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EthiopianDate } from "@/components/ui/ethiopian-date";
import type { AppLocale } from "@/i18n/routing";
import {
  getTimelineStepStates,
  resolveTimelineStepBody,
  statusBadgeTone,
  TRACK_TIMELINE_STEPS,
  type ComplaintTrackResult,
  type ComplaintTrackStatus,
  type TrackTimelineStepKey,
} from "@/lib/complaint-track";

interface ComplaintTrackResultsProps {
  result: ComplaintTrackResult;
  layout?: "stacked" | "split";
  onSearchAnother?: () => void;
}

export function ComplaintTrackResults({
  result,
  layout = "stacked",
  onSearchAnother,
}: ComplaintTrackResultsProps) {
  const t = useTranslations("complaintTrack");
  const locale = useLocale() as AppLocale;
  const status = result.status as ComplaintTrackStatus;
  const stepStates = getTimelineStepStates(status);

  const statusLabel = (s: ComplaintTrackStatus) =>
    t(`status.${s}` as "status.SUBMITTED");

  const timelineTitle = (key: TrackTimelineStepKey) =>
    t(`timeline.${key}.title`);

  const timelineStepBody = (
    stepKey: TrackTimelineStepKey,
    stepState: (typeof stepStates)[number],
  ) => {
    const resolved = resolveTimelineStepBody(stepState, stepKey, status);
    if (resolved.kind === "statusDetail") {
      return t(`statusDetail.${resolved.status}` as "statusDetail.SUBMITTED");
    }
    return t(`timeline.${resolved.stepKey}.body`);
  };

  const isSplit = layout === "split";

  const detailsBlock = (
    <>
      <div className={isSplit ? "space-y-4" : "border-b border-border-standard p-6 md:p-8"}>
        <div className="space-y-2">
          <p className="font-overline text-overline uppercase text-text-secondary">
            {t("currentStatus")}
          </p>
          <Badge tone={statusBadgeTone(status)}>{statusLabel(status)}</Badge>
        </div>
      </div>

      <div
        className={
          isSplit
            ? "grid gap-6 sm:grid-cols-2"
            : "grid gap-6 border-b border-border-standard p-6 md:grid-cols-2 md:p-8"
        }
      >
        <div>
          <p className="font-overline text-overline uppercase text-text-secondary">
            {t("subject")}
          </p>
          <p className="mt-1 font-body text-body text-on-surface">
            {result.subject}
          </p>
        </div>
        <div>
          <p className="font-overline text-overline uppercase text-text-secondary">
            {t("submittedAt")}
          </p>
          <div className="mt-1">
            <EthiopianDate
              value={result.submittedAt}
              locale={locale}
              dateStyle="long"
            />
          </div>
        </div>
      </div>

      <div className={isSplit ? "mt-6" : "p-6 md:p-8"}>
        <h3 className="mb-6 font-h3 text-h3 text-on-surface">
          {t("timelineTitle")}
        </h3>
        <ol className="relative space-y-0 border-l border-border-standard pl-6">
          {TRACK_TIMELINE_STEPS.map((step, index) => {
            const state = stepStates[index];
            const isLast = index === TRACK_TIMELINE_STEPS.length - 1;
            const icon =
              state === "completed" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-on-primary">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : state === "current" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-success bg-surface" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border-standard bg-surface-container-low">
                  <Circle className="h-2 w-2 fill-text-placeholder text-text-placeholder" />
                </span>
              );

            return (
              <li
                key={step.key}
                className={`relative ${isLast ? "" : "pb-8"}`}
              >
                <span className="absolute left-[-1.85rem] top-0.5 flex">
                  {icon}
                </span>
                <p
                  className={`font-body text-body font-semibold ${
                    state === "pending"
                      ? "text-text-secondary"
                      : "text-on-surface"
                  }`}
                >
                  {timelineTitle(step.key)}
                </p>
                <p
                  className={`mt-1 font-body-sm text-body-sm ${
                    state === "current"
                      ? "text-on-surface"
                      : "text-text-secondary"
                  }`}
                >
                  {timelineStepBody(step.key, state)}
                </p>
                {state === "current" && step.key === "received" ? (
                  <div className="mt-2">
                    <EthiopianDate
                      value={result.submittedAt}
                      locale={locale}
                      dateStyle="long"
                      className="font-body-sm text-body-sm text-text-secondary"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );

  if (isSplit) {
    return (
      <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-lg border border-border-standard bg-surface shadow-sm">
        <div className="shrink-0 border-b border-border-standard px-6 py-5 md:px-8">
          <h2 className="font-h2 text-h2 text-brand-deep">
            {t("resultsHeading", { reference: result.referenceNo })}
          </h2>
        </div>
        <div className="min-h-0 flex-1 p-6 md:p-8">{detailsBlock}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-h2 text-h2 text-brand-deep">
          {t("resultsHeading", { reference: result.referenceNo })}
        </h2>
        {onSearchAnother ? (
          <Button type="button" variant="secondary" onClick={onSearchAnother}>
            {t("searchAnother")}
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border-standard bg-surface shadow-sm">
        {detailsBlock}
      </div>
    </div>
  );
}
