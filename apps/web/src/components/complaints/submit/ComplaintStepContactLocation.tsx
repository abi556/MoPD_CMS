"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COMPLAINT_REGIONS,
  COMPLAINT_ZONES_BY_REGION,
} from "@/lib/complaint-location-options";
import type { WizardFormData } from "./types";

interface ComplaintStepContactLocationProps {
  locale: "en" | "am";
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
}

const selectClassName =
  "min-h-11 w-full rounded-none border border-border-standard bg-surface-container-lowest px-3 py-2 text-body text-on-surface shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2";

export function ComplaintStepContactLocation({
  locale,
  data,
  onChange,
  onNext,
  onBack,
  error,
}: ComplaintStepContactLocationProps) {
  const t = useTranslations("complaintSubmit");
  const zones = data.region ? (COMPLAINT_ZONES_BY_REGION[data.region] ?? []) : [];

  return (
    <form
      className="space-y-8 animate-fade-in-up"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <div className="animate-fade-in-up">
        <h2 className="mb-4 flex items-center border-b border-border-standard pb-2 text-h2 font-semibold text-brand-deep">
          <MapPin className="mr-2 h-5 w-5 text-text-secondary" aria-hidden />
          {t("sectionLocation")}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="region" className="text-label font-semibold text-on-surface">
              {t("fields.region")}{" "}
              <span className="font-normal text-text-secondary">{t("optional")}</span>
            </label>
            <select
              id="region"
              name="region"
              value={data.region}
              onChange={(e) =>
                onChange({ region: e.target.value, zone: "" })
              }
              className={selectClassName}
            >
              <option value="">{t("fields.regionPlaceholder")}</option>
              {COMPLAINT_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {locale === "am" ? r.labelAm : r.labelEn}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="zone" className="text-label font-semibold text-on-surface">
              {t("fields.zone")}{" "}
              <span className="font-normal text-text-secondary">{t("optional")}</span>
            </label>
            <select
              id="zone"
              name="zone"
              value={data.zone}
              disabled={!data.region}
              onChange={(e) => onChange({ zone: e.target.value })}
              className={selectClassName}
            >
              <option value="">{t("fields.zonePlaceholder")}</option>
              {zones.map((z) => (
                <option key={z.value} value={z.value}>
                  {locale === "am" ? z.labelAm : z.labelEn}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="woreda" className="text-label font-semibold text-on-surface">
              {t("fields.woreda")}{" "}
              <span className="font-normal text-text-secondary">{t("optional")}</span>
            </label>
            <input
              id="woreda"
              name="woreda"
              type="text"
              value={data.woreda}
              onChange={(e) => onChange({ woreda: e.target.value })}
              placeholder={t("fields.woredaPlaceholder")}
              className={selectClassName}
            />
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up [animation-delay:100ms] fill-mode-both">
        <h2 className="mb-4 flex items-center border-b border-border-standard pb-2 text-h2 font-semibold text-brand-deep">
          <User className="mr-2 h-5 w-5 text-text-secondary" aria-hidden />
          {t("sectionContact")}
        </h2>
        <p className="mb-4 text-body-sm text-text-secondary">
          {t("contactIntro")}
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label={`${t("fields.name")} ${t("optional")}`}
              name="complainantName"
              value={data.complainantName}
              onChange={(e) => onChange({ complainantName: e.target.value })}
              placeholder={t("fields.namePlaceholder")}
              className="rounded-none"
            />
          </div>
          <Input
            label={`${t("fields.email")} ${t("optional")}`}
            name="complainantEmail"
            type="email"
            value={data.complainantEmail}
            onChange={(e) => onChange({ complainantEmail: e.target.value })}
            placeholder={t("fields.emailPlaceholder")}
            hint={t("fields.emailHint")}
            className="rounded-none"
          />
          <Input
            label={`${t("fields.phone")} ${t("optional")}`}
            name="complainantPhone"
            type="tel"
            value={data.complainantPhone}
            onChange={(e) => onChange({ complainantPhone: e.target.value })}
            placeholder={t("fields.phonePlaceholder")}
            hint={t("fields.phoneHint")}
            className="rounded-none"
          />
        </div>
      </div>

      <div className="rounded-none border border-primary-fixed-dim bg-brand-wash p-5 animate-fade-in-up [animation-delay:150ms] fill-mode-both">
        <div className="flex items-start">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            checked={data.consentGiven}
            onChange={(e) => onChange({ consentGiven: e.target.checked })}
            className="mt-1 h-4 w-4 cursor-pointer rounded-none border-border-standard text-primary focus:ring-primary"
          />
          <div className="ml-3">
            <label
              htmlFor="consent"
              className="text-body-sm font-medium text-on-surface"
            >
              {t("fields.consent")}{" "}
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <p className="mt-1 text-body-sm text-text-secondary leading-relaxed">
              {t("fields.consentDetail")}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-none border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in-up" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border-standard pt-6 md:flex-row md:gap-0 animate-fade-in-up [animation-delay:200ms] fill-mode-both">
        <Button type="button" variant="secondary" onClick={onBack} className="rounded-none w-full md:w-auto transition-all duration-200 active:scale-[0.98]">
          {t("actions.back")}
        </Button>
        <Button type="submit" className="rounded-none w-full gap-2 md:w-auto transition-all duration-200 hover:shadow-md active:scale-[0.98]">
          {t("actions.continueReview")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
