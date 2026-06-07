"use client";

import { useTranslations } from "next-intl";
import { AlignLeft, ArrowRight, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComplaintFormOptionItem } from "@/lib/public-complaints";
import { CategoryPicker } from "./CategoryPicker";
import type { WizardFormData } from "./types";

interface ComplaintStepDetailsProps {
  locale: "en" | "am";
  categories: ComplaintFormOptionItem[];
  categoriesLoading?: boolean;
  categoriesUnavailable?: boolean;
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  onNext: () => void;
  onCancel: () => void;
  error: string | null;
}

export function ComplaintStepDetails({
  locale,
  categories,
  categoriesLoading = false,
  categoriesUnavailable = false,
  data,
  onChange,
  onNext,
  onCancel,
  error,
}: ComplaintStepDetailsProps) {
  const t = useTranslations("complaintSubmit");
  const charCount = data.description.length;
  const charWarning = charCount > 900;

  return (
    <form
      className="space-y-8 animate-fade-in-up"
      suppressHydrationWarning
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-on-surface-variant">
          <Tag className="h-[18px] w-[18px]" aria-hidden />
          {t("fields.category")}
          <span className="font-normal normal-case tracking-normal text-text-secondary">
            {t("optional")}
          </span>
        </legend>
        {categoriesLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="h-14 animate-pulse rounded-none bg-surface-container-high"
              />
            ))}
          </div>
        ) : categoriesUnavailable || categories.length === 0 ? (
          <p className="rounded-none border border-border-standard bg-surface-container-low p-4 text-body-sm text-text-secondary animate-fade-in-up">
            {t("errors.categoriesUnavailable")}
          </p>
        ) : (
          <CategoryPicker
            locale={locale}
            categories={categories}
            selectedId={data.categoryId}
            onSelect={(categoryId) => onChange({ categoryId })}
          />
        )}
      </fieldset>

      <section className="space-y-2 animate-fade-in-up [animation-delay:100ms] fill-mode-both">
        <label
          htmlFor="subject"
          className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          <Type className="h-[18px] w-[18px]" aria-hidden />
          {t("fields.subject")}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={data.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder={t("fields.subjectPlaceholder")}
          className="w-full rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
          suppressHydrationWarning
        />
      </section>

      <section className="space-y-2 animate-fade-in-up [animation-delay:150ms] fill-mode-both">
        <div className="flex items-center justify-between">
          <label
            htmlFor="description"
            className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            <AlignLeft className="h-[18px] w-[18px]" aria-hidden />
            {t("fields.description")}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <span
            className={`text-label font-semibold ${
              charWarning ? "text-error" : "text-text-placeholder"
            }`}
          >
            {t("fields.charCount", { count: charCount })}
          </span>
        </div>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={1000}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t("fields.descriptionPlaceholder")}
          className="w-full resize-none rounded-none border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
          suppressHydrationWarning
        />
      </section>

      {error ? (
        <p className="rounded-none border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in-up" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-border-standard pt-6 animate-fade-in-up [animation-delay:200ms] fill-mode-both">
        <button
          type="button"
          onClick={onCancel}
          suppressHydrationWarning
          className="flex cursor-pointer items-center gap-2 text-body font-bold text-text-secondary transition-colors duration-200 hover:text-on-surface"
        >
          {t("actions.cancel")}
        </button>
        <Button type="submit" className="rounded-none gap-2 px-10 py-3 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]">
          {t("actions.next")}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
