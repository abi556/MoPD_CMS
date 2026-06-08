"use client";

import { useLocale, useTranslations } from "next-intl";
import { useClientIntlSwitch } from "@/components/providers/client-intl-provider";
import type { AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const switchLocale = useClientIntlSwitch();
  const t = useTranslations("common");

  const btnClass = (active: boolean) =>
    active
      ? "rounded-none bg-primary px-2.5 py-1 font-label text-[11px] text-on-primary shadow-sm transition-all duration-200 active:scale-95 cursor-pointer sm:px-3.5 sm:py-1.5 sm:text-label"
      : "rounded-none px-2.5 py-1 font-label text-[11px] text-text-secondary transition-all duration-200 hover:text-primary active:scale-95 cursor-pointer sm:px-3.5 sm:py-1.5 sm:text-label";

  return (
    <div className="flex items-center gap-0.5 rounded-none border border-border-standard bg-surface-container-low p-0.5">
      <button
        type="button"
        onClick={() => {
          if (locale !== "en") void switchLocale("en");
        }}
        suppressHydrationWarning
        className={btnClass(locale === "en")}
        aria-label="Switch to English"
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
      >
        {t("localeAm")}
      </button>
    </div>
  );
}
