"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const nextLocale: AppLocale = locale === "en" ? "am" : "en";
  const label = locale === "en" ? t("localeAm") : t("localeEn");

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="min-h-9 cursor-pointer rounded-lg border border-transparent px-3 py-1.5 text-body-sm font-body-sm text-text-secondary transition-all duration-200 hover:border-brand-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      aria-label="Switch language"
    >
      {label}
    </button>
  );
}
