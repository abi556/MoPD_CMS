"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { WizardStep } from "./types";

interface SubmitProgressBarProps {
  step: WizardStep;
}

const STEPS: WizardStep[] = [1, 2, 3];

export function SubmitProgressBar({ step }: SubmitProgressBarProps) {
  const t = useTranslations("complaintSubmit");

  const labels: Record<WizardStep, string> = {
    1: t("steps.details"),
    2: t("steps.contact"),
    3: t("steps.review"),
  };

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="mb-8 animate-fade-in-up sm:mb-12">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="mb-1 block text-overline font-semibold uppercase tracking-wider text-primary">
            {t("overline")}
          </span>
          <h1 className="text-h1-mobile font-semibold tracking-tight text-on-surface sm:text-h1">
            {step === 1
              ? t("headings.step1")
              : step === 2
                ? t("headings.step2")
                : t("headings.step3")}
          </h1>
        </div>
        <span className="shrink-0 text-label font-semibold text-text-secondary">
          {t("progress", { percent: progressPercent })}
        </span>
      </div>
      <div className="relative h-1 overflow-hidden rounded-none bg-border-standard">
        <div
          className="absolute left-0 top-0 h-full rounded-none bg-primary transition-[width] duration-500 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1 text-center">
        {STEPS.map((s) => (
          <span
            key={s}
            className={`text-[10px] font-semibold leading-tight sm:text-label ${
              s === step
                ? "text-primary"
                : s < step
                  ? "text-primary"
                  : "text-text-placeholder"
            }`}
          >
            {labels[s]}
          </span>
        ))}
      </div>
      <div className="mt-6 hidden items-center justify-between md:flex">
        {STEPS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-label font-semibold shadow-sm transition-all duration-300 ${
                s < step
                  ? "bg-primary text-on-primary"
                  : s === step
                    ? "bg-primary text-on-primary ring-4 ring-brand-wash"
                    : "border border-border-standard bg-surface-container-high text-text-placeholder"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" aria-hidden /> : s}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
