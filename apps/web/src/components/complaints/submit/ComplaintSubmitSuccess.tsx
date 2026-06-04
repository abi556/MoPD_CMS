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
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-lg border border-border-standard bg-surface p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] md:p-12">
      <CheckCircle2
        className="mb-4 h-16 w-16 text-success"
        aria-hidden
        strokeWidth={1.5}
      />
      <h1 className="mb-4 text-display font-semibold text-on-surface">
        {t("success.title")}
      </h1>
      <p className="mb-10 max-w-lg text-body text-text-secondary">
        {t("success.body")}
      </p>

      <div className="relative mb-6 w-full rounded-lg border border-border-standard bg-surface-container p-6">
        <span className="mb-2 block text-overline font-semibold uppercase tracking-wider text-text-secondary">
          {t("success.reference")}
        </span>
        <div className="mx-auto flex w-fit items-center justify-center gap-4 rounded border border-border-standard bg-surface px-6 py-4 shadow-sm">
          <span className="font-mono text-h2 tracking-wide text-brand-deep">
            {referenceNo}
          </span>
          <button
            type="button"
            onClick={copyReference}
            aria-label={t("success.copyAria")}
            className="cursor-pointer rounded-full p-2 text-primary transition-colors hover:bg-brand-wash"
          >
            <ClipboardCopy className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p
          className={`mt-3 text-label font-semibold text-success transition-opacity duration-300 ${
            copied ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          {t("success.copied")}
        </p>
      </div>

      <div
        className="mb-10 w-full rounded-lg border border-warning/40 bg-warning/10 p-4 text-left"
        role="note"
      >
        <h2 className="mb-1 flex items-center gap-2 text-h3 font-semibold text-on-surface">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
          {t("success.keepSafeTitle")}
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          {t("success.keepSafeBody")}
        </p>
      </div>

      <div className="mb-10 w-full rounded-lg border border-secondary-container bg-brand-wash p-6 text-left">
        <h2 className="mb-4 flex items-center gap-2 text-h3 font-semibold text-primary-container">
          {t("success.nextTitle")}
        </h2>
        <ul className="space-y-4 text-body text-on-surface-variant">
          <li className="flex items-start gap-3">
            <Scale className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
            <span>{t("success.next1")}</span>
          </li>
          <li className="flex items-start gap-3">
            <Next2Icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
            <span>{next2Message}</span>
          </li>
          <li className="flex items-start gap-3">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
            <span>{t("success.next3")}</span>
          </li>
        </ul>
      </div>

      <p className="mb-6 w-full text-body text-text-secondary">
        {t("success.evidencePrompt")}
      </p>

      <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
        <Button
          type="button"
          onClick={onAttachEvidence}
          className="w-full gap-2 sm:w-auto"
        >
          <FileUp className="h-4 w-4" aria-hidden />
          {t("success.attachEvidence")}
        </Button>
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
  );
}
