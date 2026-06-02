/**
 * Ethiopian calendar display helper (Phase 1 stub).
 * Full Temporal-based conversion can replace this in a later task.
 */

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

/** Approximate Ethiopian date parts for display (not for legal deadlines). */
export function toEthiopianDisplayParts(date: Date): {
  year: number;
  month: number;
  day: number;
  monthName: string;
} {
  const jdn = gregorianToJdn(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  const { year, month, day } = jdnToEthiopian(jdn);
  return {
    year,
    month,
    day,
    monthName: ETHIOPIAN_MONTHS_EN[month - 1] ?? "Pagumen",
  };
}

export function formatEthiopianDate(
  date: Date,
  locale: "en" | "am" = "en",
): string {
  const { year, month, day, monthName } = toEthiopianDisplayParts(date);
  if (locale === "am") {
    return `${day}/${month}/${year} ዓ.ም.`;
  }
  return `${monthName} ${day}, ${year} (EC)`;
}

export function formatGregorianDate(
  date: Date,
  locale: "en" | "am",
): string {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-ET", {
    dateStyle: "medium",
    timeZone: "Africa/Addis_Ababa",
  }).format(date);
}

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  const r = (jdn - 1723856) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}
