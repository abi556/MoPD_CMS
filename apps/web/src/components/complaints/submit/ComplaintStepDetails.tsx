"use client";

import { useTranslations } from "next-intl";
import { AlignLeft, ArrowRight, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComplaintFormOptionItem } from "@/lib/public-complaints";
import { optionLabel } from "@/lib/public-complaints";
import { getCategoryIcon } from "./category-icons";
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
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-on-surface-variant">
          <Tag className="h-[18px] w-[18px]" aria-hidden />
          {t("fields.category")}
        </legend>
        {categoriesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="h-[88px] animate-pulse rounded-lg bg-surface-container-high"
              />
            ))}
          </div>
        ) : categoriesUnavailable || categories.length === 0 ? (
          <p className="rounded-lg border border-border-standard bg-surface-container-low p-4 text-body-sm text-text-secondary">
            {t("errors.categoriesUnavailable")}
          </p>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.code);
            const selected = data.categoryId === cat.id;
            return (
              <label
                key={cat.id}
                className="group relative cursor-pointer"
              >
                <input
                  type="radio"
                  name="categoryId"
                  value={cat.id}
                  checked={selected}
                  onChange={() => onChange({ categoryId: cat.id })}
                  className="peer sr-only"
                  aria-label={optionLabel(cat, locale)}
                />
                <div className="flex items-center gap-4 rounded-lg border border-border-standard p-4 transition-all peer-checked:border-primary peer-checked:bg-brand-wash hover:border-primary">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <p className="text-h3 font-semibold text-on-surface">
                      {optionLabel(cat, locale)}
                    </p>
                    <p className="text-body-sm leading-tight text-text-secondary">
                      {cat.code.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        )}
      </fieldset>

      <section className="space-y-2">
        <label
          htmlFor="subject"
          className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          <Type className="h-[18px] w-[18px]" aria-hidden />
          {t("fields.subject")}
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={data.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder={t("fields.subjectPlaceholder")}
          className="w-full rounded-lg border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="description"
            className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            <AlignLeft className="h-[18px] w-[18px]" aria-hidden />
            {t("fields.description")}
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
          className="w-full resize-none rounded-lg border border-border-standard bg-surface-bright px-4 py-3 text-body text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </section>

      {error ? (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-border-standard pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex cursor-pointer items-center gap-2 text-body font-bold text-text-secondary transition-colors hover:text-on-surface"
        >
          {t("actions.cancel")}
        </button>
        <Button type="submit" className="gap-2 px-10 py-3 shadow-md">
          {t("actions.next")}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
