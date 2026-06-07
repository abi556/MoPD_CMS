"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ComplaintFormOptionItem } from "@/lib/public-complaints";
import { optionLabel } from "@/lib/public-complaints";
import { getCategoryIcon } from "./category-icons";
import { sortCategoriesForPicker } from "./category-picker-order";

const INITIAL_VISIBLE = 4;

function visibleCategories(
  categories: ComplaintFormOptionItem[],
  selectedId: string,
  expanded: boolean,
): ComplaintFormOptionItem[] {
  if (expanded || categories.length <= INITIAL_VISIBLE) {
    return categories;
  }

  const primary = categories.slice(0, INITIAL_VISIBLE);
  const selected = categories.find((c) => c.id === selectedId);
  if (selected && !primary.some((c) => c.id === selected.id)) {
    return [...primary.slice(0, INITIAL_VISIBLE - 1), selected];
  }
  return primary;
}

interface CategoryPickerProps {
  locale: "en" | "am";
  categories: ComplaintFormOptionItem[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryPicker({
  locale,
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  const t = useTranslations("complaintSubmit");
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => sortCategoriesForPicker(categories),
    [categories],
  );
  const canCollapse = sorted.length > INITIAL_VISIBLE;
  const hiddenCount = sorted.length - INITIAL_VISIBLE;
  const shown = useMemo(
    () => visibleCategories(sorted, selectedId, expanded),
    [sorted, selectedId, expanded],
  );

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-text-secondary">{t("fields.categorySkipHint")}</p>

      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label={t("fields.category")}
      >
        {shown.map((cat, index) => {
          const Icon = getCategoryIcon(cat.code);
          const selected = selectedId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(selected ? "" : cat.id)}
              style={{ animationDelay: `${index * 40}ms` }}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-none border px-4 py-3.5 text-left transition-all duration-200 animate-fade-in-up fill-mode-both hover:bg-brand-wash ${
                selected
                  ? "border-primary bg-brand-wash shadow-sm"
                  : "border-border-standard bg-surface"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                  selected
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-text-secondary"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-body font-semibold leading-snug text-on-surface">
                {optionLabel(cat, locale)}
              </p>
            </button>
          );
        })}
      </div>

      {selectedId ? (
        <button
          type="button"
          onClick={() => onSelect("")}
          className="text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("actions.clearCategory")}
        </button>
      ) : null}

      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex w-full items-center justify-center gap-1.5 rounded-none border border-dashed border-border-standard px-3 py-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 hover:border-primary hover:bg-brand-wash"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              {t("actions.showFewerCategories")}
              <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              {t("actions.showMoreCategories", { count: hiddenCount })}
              <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
