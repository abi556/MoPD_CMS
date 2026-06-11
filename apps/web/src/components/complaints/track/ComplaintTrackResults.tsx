"use client";

import { Check, Circle, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EthiopianDate } from "@/components/ui/ethiopian-date";
import type { AppLocale } from "@/i18n/routing";
import {
  getTimelineStepStates,
  resolveTimelineStepBody,
  showsAppealGuidance,
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
  const tAppeal = useTranslations("complaintTrack.appealGuidance");
  const locale = useLocale() as AppLocale;
  const status = result.status as ComplaintTrackStatus;
  const stepStates = getTimelineStepStates(status);
  const showAppeal = showsAppealGuidance(status);
  const supportEmail = "support@mopd.gov.et";

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
      <div className={isSplit ? "space-y-4 animate-fade-in-up" : "border-b border-border-standard p-6 md:p-8 animate-fade-in-up"}>
        <div className="space-y-2">
          <p className="font-overline text-overline uppercase text-text-secondary">
            {t("currentStatus")}
          </p>
          <Badge tone={statusBadgeTone(status)} className="rounded-none px-3 py-1 text-xs font-semibold uppercase tracking-wider">{statusLabel(status)}</Badge>
        </div>
      </div>

      <div
        className={
          isSplit
            ? "grid gap-6 sm:grid-cols-2 animate-fade-in-up [animation-delay:100ms] fill-mode-both"
            : "grid gap-6 border-b border-border-standard p-6 md:grid-cols-2 md:p-8 animate-fade-in-up [animation-delay:100ms] fill-mode-both"
        }
      >
        <div>
          <p className="font-overline text-overline uppercase text-text-secondary">
            {t("subject")}
          </p>
          <p className="mt-1 font-body text-body font-semibold text-on-surface leading-relaxed">
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
              className="font-body text-body font-semibold text-on-surface"
            />
          </div>
        </div>
      </div>

      {showAppeal ? (
        <div
          className={`rounded-none border border-primary/20 bg-brand-wash p-5 animate-fade-in-up [animation-delay:125ms] fill-mode-both ${
            isSplit ? "mt-6" : "mx-6 md:mx-8"
          }`}
        >
          <div className="flex gap-3">
            <Mail
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              aria-hidden
            />
            <div>
              <h3 className="font-label text-label font-semibold text-on-surface">
                {tAppeal("title")}
              </h3>
              <p className="mt-2 font-body-sm text-body-sm leading-relaxed text-text-secondary">
                {tAppeal("bodyBeforeEmail")}{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {supportEmail}
                </a>{" "}
                {tAppeal("bodyBetween")}{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {tAppeal("contactLink")}
                </Link>
                {tAppeal("bodyAfter")}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={isSplit ? "mt-6 animate-fade-in-up [animation-delay:150ms] fill-mode-both" : "p-6 md:p-8 animate-fade-in-up [animation-delay:150ms] fill-mode-both"}>
        <h3 className="mb-6 font-h3 text-h3 text-on-surface font-semibold tracking-tight">
          {t("timelineTitle")}
        </h3>
        <ol className="relative space-y-0 border-l border-border-standard pl-6">
          {TRACK_TIMELINE_STEPS.map((step, index) => {
            const state = stepStates[index];
            const isLast = index === TRACK_TIMELINE_STEPS.length - 1;
            const icon =
              state === "completed" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-on-primary animate-scale-in">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : state === "current" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-success bg-surface animate-pulse" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border-standard bg-surface-container-low">
                  <Circle className="h-2 w-2 fill-text-placeholder text-text-placeholder" />
                </span>
              );

            return (
              <li
                key={step.key}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                className={`relative ${isLast ? "" : "pb-8"} animate-fade-in-up fill-mode-both`}
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
                  className={`mt-1 font-body-sm text-body-sm leading-relaxed ${
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
      <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-none border border-border-standard bg-surface shadow-sm animate-fade-in-up">
        <div className="shrink-0 border-b border-border-standard px-6 py-5 md:px-8">
          <h2 className="font-h2 text-h2 text-brand-deep tracking-tight">
            {t("resultsHeading", { reference: result.referenceNo })}
          </h2>
        </div>
        <div className="min-h-0 flex-1 p-6 md:p-8">{detailsBlock}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <h2 className="font-h2 text-h2 text-brand-deep tracking-tight">
          {t("resultsHeading", { reference: result.referenceNo })}
        </h2>
        {onSearchAnother ? (
          <Button type="button" variant="secondary" onClick={onSearchAnother} className="rounded-none transition-all duration-200 active:scale-[0.98]">
            {t("searchAnother")}
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-none border border-border-standard bg-surface shadow-sm">
        {detailsBlock}
      </div>
    </div>
  );
}
