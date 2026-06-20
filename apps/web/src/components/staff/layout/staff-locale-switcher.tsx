"use client";

import { useLocale, useTranslations } from "next-intl";
import { useClientIntlSwitch } from "@/components/providers/client-intl-provider";
import type { AppLocale } from "@/i18n/routing";

export function StaffLocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const switchLocale = useClientIntlSwitch();
  const t = useTranslations("common");

  const btnClass = (active: boolean) =>
    active
      ? "rounded-md bg-staff-nav-active-bg px-2.5 py-1 text-[11px] font-medium text-staff-nav-active-text shadow-sm transition-colors duration-200 cursor-pointer sm:px-3 sm:py-1.5 sm:text-xs"
      : "rounded-md px-2.5 py-1 text-[11px] font-medium text-staff-text-muted transition-colors duration-200 hover:text-staff-text cursor-pointer sm:px-3 sm:py-1.5 sm:text-xs";

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-staff-nav-hover/35 p-0.5"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => {
          if (locale !== "en") void switchLocale("en");
        }}
        suppressHydrationWarning
        className={btnClass(locale === "en")}
        aria-label="Switch to English"
        aria-pressed={locale === "en"}
      >
        {t("localeEn")}
      </button>
      <button
        type="button"
        onClick={() => {
          if (locale !== "am") void switchLocale("am");
        }}
        suppressHydrationWarning
        className={btnClass(locale === "am")}
        aria-label="Switch to Amharic"
        aria-pressed={locale === "am"}
      >
        {t("localeAm")}
      </button>
    </div>
  );
}
