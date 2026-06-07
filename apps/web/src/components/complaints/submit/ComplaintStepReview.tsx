"use client";

import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComplaintFormOptionItem } from "@/lib/public-complaints";
import { optionLabel } from "@/lib/public-complaints";
import {
  getRegionLabel,
  getZoneLabel,
} from "@/lib/complaint-location-options";
import type { WizardFormData } from "./types";

interface ComplaintStepReviewProps {
  locale: "en" | "am";
  categories: ComplaintFormOptionItem[];
  data: WizardFormData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="border-b border-border-standard py-3.5 last:border-0">
      <dt className="text-label font-semibold text-text-secondary">{label}</dt>
      <dd className="mt-1 text-body text-on-surface leading-relaxed">{value}</dd>
    </div>
  );
}

export function ComplaintStepReview({
  locale,
  categories,
  data,
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: ComplaintStepReviewProps) {
  const t = useTranslations("complaintSubmit");

  const category = categories.find((c) => c.id === data.categoryId);

  const locationParts: string[] = [];
  if (data.region) {
    locationParts.push(getRegionLabel(data.region, locale));
  }
  if (data.zone) {
    locationParts.push(getZoneLabel(data.region, data.zone, locale));
  }
  if (data.woreda.trim()) {
    locationParts.push(data.woreda.trim());
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-body text-text-secondary">{t("reviewIntro")}</p>

      <section className="rounded-none border border-border-standard bg-surface-container-low p-6 transition-all duration-200 hover:shadow-sm animate-fade-in-up">
        <h2 className="mb-4 text-h3 font-semibold text-brand-deep border-b border-border-standard/60 pb-2">
          {t("reviewSections.complaint")}
        </h2>
        <dl>
          <ReviewRow
            label={t("fields.category")}
            value={category ? optionLabel(category, locale) : ""}
          />
          <ReviewRow label={t("fields.subject")} value={data.subject} />
          <ReviewRow label={t("fields.description")} value={data.description} />
        </dl>
      </section>

      <section className="rounded-none border border-border-standard bg-surface-container-low p-6 transition-all duration-200 hover:shadow-sm animate-fade-in-up [animation-delay:100ms] fill-mode-both">
        <h2 className="mb-4 text-h3 font-semibold text-brand-deep border-b border-border-standard/60 pb-2">
          {t("reviewSections.personalLocation")}
        </h2>
        <dl>
          <ReviewRow label={t("fields.name")} value={data.complainantName} />
          <ReviewRow label={t("fields.email")} value={data.complainantEmail} />
          <ReviewRow label={t("fields.phone")} value={data.complainantPhone} />
          <ReviewRow
            label={t("fields.locationSummary")}
            value={locationParts.join(" · ")}
          />
        </dl>
      </section>

      {error ? (
        <p
          className="rounded-none border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in-up"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border-standard pt-6 md:flex-row animate-fade-in-up [animation-delay:150ms] fill-mode-both">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-none w-full md:w-auto transition-all duration-200 active:scale-[0.98]"
        >
          {t("actions.back")}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-none w-full gap-2 md:w-auto transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
