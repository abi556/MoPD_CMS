"use client";

import { useMemo } from "react";
import {
  formatLocalizedDatePair,
  type DateDisplayStyle,
} from "@/lib/ethiopian-calendar";
import type { AppLocale } from "@/i18n/routing";

function toIso(value: string | Date): string {
  return (typeof value === "string" ? new Date(value) : value).toISOString();
}

export function EthiopianDate({
  value,
  locale,
  dateStyle = "medium",
  className,
}: {
  value: string | Date;
  locale: AppLocale;
  dateStyle?: DateDisplayStyle;
  className?: string;
}) {
  const iso = toIso(value);

  const pair = useMemo(
    () => formatLocalizedDatePair(value, locale, dateStyle),
    [value, locale, dateStyle],
  );

  return (
    <time
      dateTime={iso}
      suppressHydrationWarning
      className={className ?? "font-body text-body text-on-surface"}
    >
      <span>{pair.gregorian}</span>
      <span className="mx-1 text-text-secondary" aria-hidden="true">
        ·
      </span>
      <span className={locale === "am" ? "font-ethiopic" : undefined}>
        {pair.ethiopian}
      </span>
    </time>
  );
}
