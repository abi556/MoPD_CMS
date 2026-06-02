import {
  formatEthiopianDate,
  formatGregorianDate,
} from "@/lib/ethiopian-calendar";
import type { AppLocale } from "@/i18n/routing";

export function EthiopianDate({
  value,
  locale,
}: {
  value: string | Date;
  locale: AppLocale;
}) {
  const date = typeof value === "string" ? new Date(value) : value;
  return (
    <time dateTime={date.toISOString()} className="text-sm text-on-surface">
      <span>{formatGregorianDate(date, locale)}</span>
      <span className="mx-1 text-text-secondary" aria-hidden="true">
        ·
      </span>
      <span className={locale === "am" ? "font-ethiopic" : undefined}>
        {formatEthiopianDate(date, locale)}
      </span>
    </time>
  );
}
