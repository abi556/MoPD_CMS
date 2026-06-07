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
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-lg border border-border-standard bg-surface p-6 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] md:p-8">
      <CheckCircle2
        className="mb-3 h-12 w-12 text-success"
        aria-hidden
        strokeWidth={1.5}
      />
      <h1 className="mb-2 text-h1 font-semibold text-on-surface">
        {t("success.title")}
      </h1>
      <p className="mb-5 max-w-lg text-body-sm text-text-secondary">
        {t("success.body")}
      </p>

      <div className="relative mb-4 w-full rounded-lg border border-border-standard bg-surface-container p-4 md:p-5">
        <span className="mb-2 block text-overline font-semibold uppercase tracking-wider text-text-secondary">
          {t("success.reference")}
        </span>
        <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded border border-border-standard bg-surface px-4 py-3 shadow-sm sm:gap-4 sm:px-5">
          <span className="break-all font-mono text-h3 tracking-wide text-brand-deep sm:text-h2">
            {referenceNo}
          </span>
          <button
            type="button"
            onClick={copyReference}
            aria-label={t("success.copyAria")}
            className="shrink-0 cursor-pointer rounded-full p-2 text-primary transition-colors hover:bg-brand-wash"
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

      <div className="mb-5 w-full space-y-3">
        <p className="text-body-sm text-text-secondary">
          {t("success.evidencePrompt")}
        </p>
        <Button
          type="button"
          onClick={onAttachEvidence}
          className="w-full gap-2 py-3"
        >
          <FileUp className="h-4 w-4" aria-hidden />
          {t("success.attachEvidence")}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/complaints/track" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              {t("success.trackLink")}
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={onDone}
            className="w-full sm:w-auto"
          >
            {t("success.returnPortal")}
          </Button>
        </div>
      </div>

      <div className="w-full space-y-4 text-left">
        <div
          className="rounded-lg border border-warning/40 bg-warning/10 p-3 md:p-4"
          role="note"
        >
          <h2 className="mb-1 flex items-center gap-2 text-body font-semibold text-on-surface">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-warning"
              aria-hidden
            />
            {t("success.keepSafeTitle")}
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {t("success.keepSafeBody")}
          </p>
        </div>

        <details className="group w-full rounded-lg border border-secondary-container bg-brand-wash text-left">
          <summary className="cursor-pointer list-none rounded-lg p-4 text-h3 font-semibold text-primary-container marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              {t("success.nextTitle")}
              <span
                className="text-body-sm font-normal text-text-secondary transition-transform group-open:rotate-180"
                aria-hidden
              >
                ▾
              </span>
            </span>
          </summary>
          <ul className="space-y-3 border-t border-secondary-container/40 px-4 pb-4 pt-3 text-body-sm text-on-surface-variant">
            <li className="flex items-start gap-3">
              <Scale
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                aria-hidden
              />
              <span>{t("success.next1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <Next2Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                aria-hidden
              />
              <span>{next2Message}</span>
            </li>
            <li className="flex items-start gap-3">
              <BarChart3
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                aria-hidden
              />
              <span>{t("success.next3")}</span>
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}
