import { EthDateTime } from "ethiopian-calendar-date-converter";
import type { AppLocale } from "@/i18n/routing";

const ADDIS_ABABA_TZ = "Africa/Addis_Ababa";

const ETHIOPIAN_MONTHS_EN = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagumen",
] as const;

const ETHIOPIAN_MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
] as const;

export type EthiopianDisplayParts = {
  year: number;
  month: number;
  day: number;
  monthName: string;
};

export type LocalizedDatePair = {
  gregorian: string;
  ethiopian: string;
  iso: string;
};

export type DateDisplayStyle = "medium" | "long";

function parseToDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** Civil calendar Y-M-D in Addis Ababa for a UTC instant. */
export function getAddisAbabaDateParts(value: string | Date): {
  year: number;
  month: number;
  day: number;
} {
  const instant = parseToDate(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADDIS_ABABA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
}

/** Gregorian civil date in Addis Ababa as UTC noon (SSR/client stable). */
export function toAddisAbabaCalendarDate(value: string | Date): Date {
  const { year, month, day } = getAddisAbabaDateParts(value);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function toEthiopianDisplayParts(value: string | Date): EthiopianDisplayParts {
  const civil = toAddisAbabaCalendarDate(value);
  const eth = EthDateTime.fromEuropeanDate(civil);
  const month = eth.month;
  const day = eth.date;
  const monthIndex = month - 1;

  return {
    year: eth.year,
    month,
    day,
    monthName:
      ETHIOPIAN_MONTHS_EN[monthIndex] ??
      ETHIOPIAN_MONTHS_EN[ETHIOPIAN_MONTHS_EN.length - 1],
  };
}

export function formatEthiopianDate(
  value: string | Date,
  locale: AppLocale = "en",
): string {
  const { year, month, day } = toEthiopianDisplayParts(value);
  const monthIndex = month - 1;

  if (locale === "am") {
    const monthName =
      ETHIOPIAN_MONTHS_AM[monthIndex] ??
      ETHIOPIAN_MONTHS_AM[ETHIOPIAN_MONTHS_AM.length - 1];
    return `${monthName} ${day}, ${year}`;
  }

  const monthName =
    ETHIOPIAN_MONTHS_EN[monthIndex] ??
    ETHIOPIAN_MONTHS_EN[ETHIOPIAN_MONTHS_EN.length - 1];
  return `${monthName} ${day}, ${year} (EC)`;
}

export function formatGregorianDate(
  value: string | Date,
  locale: AppLocale,
  dateStyle: DateDisplayStyle = "medium",
): string {
  const instant = parseToDate(value);
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-ET", {
    dateStyle,
    timeZone: ADDIS_ABABA_TZ,
  }).format(instant);
}

export function formatLocalizedDatePair(
  value: string | Date,
  locale: AppLocale,
  dateStyle: DateDisplayStyle = "medium",
): LocalizedDatePair {
  const instant = parseToDate(value);
  return {
    gregorian: formatGregorianDate(instant, locale, dateStyle),
    ethiopian: formatEthiopianDate(instant, locale),
    iso: instant.toISOString(),
  };
}
