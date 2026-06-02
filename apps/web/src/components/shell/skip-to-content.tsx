"use client";

import { useTranslations } from "next-intl";

export function SkipToContent() {
  const t = useTranslations("common");
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
    >
      {t("skipToContent")}
    </a>
  );
}
