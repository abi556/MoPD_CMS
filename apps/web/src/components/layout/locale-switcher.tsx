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
      ? "rounded-none bg-primary px-3.5 py-1.5 font-label text-label text-on-primary shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
      : "rounded-none px-3.5 py-1.5 font-label text-label text-text-secondary hover:text-primary transition-all duration-200 active:scale-95 cursor-pointer";

  return (
    <div className="flex items-center gap-0.5 border border-border-standard p-0.5 rounded-none bg-surface-container-low">
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
