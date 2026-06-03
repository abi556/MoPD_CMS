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
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {shown.map((cat) => {
          const Icon = getCategoryIcon(cat.code);
          const selected = selectedId === cat.id;
          return (
            <label key={cat.id} className="relative cursor-pointer">
              <input
                type="radio"
                name="categoryId"
                value={cat.id}
                checked={selected}
                onChange={() => onSelect(cat.id)}
                className="peer sr-only"
                aria-label={optionLabel(cat, locale)}
              />
              <div
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-brand-wash ${
                  selected
                    ? "border-primary bg-brand-wash"
                    : "border-border-standard bg-surface"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selected
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-text-secondary"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <p className="text-body font-semibold leading-snug text-on-surface">
                  {optionLabel(cat, locale)}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-standard px-3 py-2 text-body-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-brand-wash"
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
