"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

function LocaleSwitcherInner() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("common");
  const nextLocale: AppLocale = locale === "en" ? "am" : "en";
  const label = locale === "en" ? t("localeAm") : t("localeEn");

  const switchLocale = () => {
    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      suppressHydrationWarning
      className="min-h-9 cursor-pointer rounded-lg border border-transparent px-3 py-1.5 text-body-sm font-body-sm text-text-secondary transition-all duration-200 hover:border-brand-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      aria-label="Switch language"
    >
      {label}
    </button>
  );
}

function LocaleSwitcherFallback() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common");
  const label = locale === "en" ? t("localeAm") : t("localeEn");

  return (
    <button
      type="button"
      disabled
      suppressHydrationWarning
      className="min-h-9 rounded-lg border border-transparent px-3 py-1.5 text-body-sm font-body-sm text-text-secondary opacity-70"
      aria-label="Switch language"
    >
      {label}
    </button>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={<LocaleSwitcherFallback />}>
      <LocaleSwitcherInner />
    </Suspense>
  );
}
