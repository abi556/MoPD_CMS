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
    <div className="border-b border-border-standard py-3 last:border-0">
      <dt className="text-label font-semibold text-text-secondary">{label}</dt>
      <dd className="mt-1 text-body text-on-surface">{value}</dd>
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
    <div className="space-y-8">
      <p className="text-body text-text-secondary">{t("reviewIntro")}</p>

      <section className="rounded-lg border border-border-standard bg-surface-container-low p-6">
        <h2 className="mb-4 text-h3 font-semibold text-brand-deep">
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

      <section className="rounded-lg border border-border-standard bg-surface-container-low p-6">
        <h2 className="mb-4 text-h3 font-semibold text-brand-deep">
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
          className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border-standard pt-6 md:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {t("actions.back")}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full gap-2 md:w-auto"
        >
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
