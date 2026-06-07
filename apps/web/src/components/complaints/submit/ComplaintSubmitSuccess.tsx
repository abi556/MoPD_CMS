"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCopy,
  FileUp,
  Mail,
  Scale,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AckContext } from "@/lib/complaint-ack-context";

interface ComplaintSubmitSuccessProps {
  referenceNo: string;
  ackContext: AckContext;
  maskedEmail?: string;
  onAttachEvidence: () => void;
  onDone: () => void;
}

export function ComplaintSubmitSuccess({
  referenceNo,
  ackContext,
  maskedEmail,
  onAttachEvidence,
  onDone,
}: ComplaintSubmitSuccessProps) {
  const t = useTranslations("complaintSubmit");
  const [copied, setCopied] = useState(false);

  const copyReference = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referenceNo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [referenceNo]);

  const next2Message =
    ackContext === "email" && maskedEmail
      ? t("success.next2Email", { email: maskedEmail })
      : ackContext === "phone_only"
        ? t("success.next2PhoneOnly")
        : t("success.next2None");

  const Next2Icon =
    ackContext === "email"
      ? Mail
      : ackContext === "phone_only"
        ? Smartphone
        : AlertTriangle;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-none border border-border-standard bg-surface p-6 text-center shadow-sm md:p-10 animate-fade-in-up">
      <CheckCircle2
        className="mb-4 h-14 w-14 text-success animate-scale-in"
        aria-hidden
        strokeWidth={1.5}
      />
      <h1 className="mb-2 text-h1 font-semibold text-on-surface tracking-tight">
        {t("success.title")}
      </h1>
      <p className="mb-6 max-w-lg text-body-sm text-text-secondary leading-relaxed">
        {t("success.body")}
      </p>

      <div className="relative mb-6 w-full rounded-none border border-border-standard bg-surface-container p-5 md:p-6 animate-fade-in-up [animation-delay:100ms] fill-mode-both">
        <span className="mb-2.5 block text-overline font-semibold uppercase tracking-wider text-text-secondary">
          {t("success.reference")}
        </span>
        <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-none border border-border-standard bg-surface px-4 py-3.5 shadow-sm sm:gap-4 sm:px-5">
          <span className="break-all font-mono text-h3 font-bold tracking-wide text-brand-deep sm:text-h2">
            {referenceNo}
          </span>
          <button
            type="button"
            onClick={copyReference}
            aria-label={t("success.copyAria")}
            className="shrink-0 cursor-pointer rounded-none p-2 text-primary transition-colors duration-200 hover:bg-brand-wash"
          >
            <ClipboardCopy className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p
          className={`mt-2 text-label font-semibold text-success transition-opacity duration-300 ${
            copied ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          {t("success.copied")}
        </p>
      </div>

      <div className="mb-6 w-full space-y-4 animate-fade-in-up [animation-delay:150ms] fill-mode-both">
        <p className="text-body-sm text-text-secondary">
          {t("success.evidencePrompt")}
        </p>
        <Button
          type="button"
          onClick={onAttachEvidence}
          className="rounded-none w-full gap-2 py-3.5 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <FileUp className="h-4 w-4" aria-hidden />
          {t("success.attachEvidence")}
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/complaints/track" className="w-full sm:w-auto">
            <Button variant="secondary" className="rounded-none w-full transition-all duration-200 active:scale-[0.98]">
              {t("success.trackLink")}
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={onDone}
            className="rounded-none w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
          >
            {t("success.returnPortal")}
          </Button>
        </div>
      </div>

      <div className="w-full space-y-4 text-left animate-fade-in-up [animation-delay:200ms] fill-mode-both">
        <div
          className="rounded-none border border-warning/40 bg-warning/10 p-4 md:p-5"
          role="note"
        >
          <h2 className="mb-1.5 flex items-center gap-2 text-body font-semibold text-on-surface">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-warning"
              aria-hidden
            />
            {t("success.keepSafeTitle")}
          </h2>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">
            {t("success.keepSafeBody")}
          </p>
        </div>

        <details className="group w-full rounded-none border border-secondary-container bg-brand-wash text-left">
          <summary className="cursor-pointer list-none rounded-none p-4 text-h3 font-semibold text-primary-container marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              {t("success.nextTitle")}
              <span
                className="text-body-sm font-normal text-text-secondary transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              >
                ▾
              </span>
            </span>
          </summary>
          <ul className="space-y-3.5 border-t border-secondary-container/40 px-4 pb-4 pt-3.5 text-body-sm text-on-surface-variant">
            <li className="flex items-start gap-3">
              <Scale
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                aria-hidden
              />
              <span className="leading-relaxed">{t("success.next1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <Next2Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                aria-hidden
              />
              <span className="leading-relaxed">{next2Message}</span>
            </li>
            <li className="flex items-start gap-3">
              <BarChart3
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                aria-hidden
              />
              <span className="leading-relaxed">{t("success.next3")}</span>
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}
