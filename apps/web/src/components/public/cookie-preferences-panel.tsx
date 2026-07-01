"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  acceptAllCookies,
  persistConsent,
  rejectNonEssentialCookies,
  type CookieConsentCategories,
} from "@/lib/public/cookie-consent";
import { logCookieConsentToServer } from "@/lib/public/cookie-consent-api";

interface CookiePreferencesPanelProps {
  initialAnalytics?: boolean;
  onSaved?: () => void;
  showActions?: boolean;
}

export function CookiePreferencesPanel({
  initialAnalytics = false,
  onSaved,
  showActions = true,
}: CookiePreferencesPanelProps) {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [analytics, setAnalytics] = useState(initialAnalytics);

  const save = async (action: "save_preferences" | "accept_all" | "reject_non_essential") => {
    let categories: CookieConsentCategories;
    if (action === "accept_all") {
      categories = { essential: true, analytics: true };
      acceptAllCookies();
    } else if (action === "reject_non_essential") {
      categories = { essential: true, analytics: false };
      rejectNonEssentialCookies();
    } else {
      categories = { essential: true, analytics };
      persistConsent(categories);
    }
    await logCookieConsentToServer(action, categories, locale);
    onSaved?.();
  };

  return (
    <div className="space-y-5">
      <p className="text-body-sm text-text-secondary leading-relaxed">
        {t("preferencesIntro")}
      </p>

      <div className="space-y-4 border border-border-standard bg-surface-container-lowest p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label text-label font-semibold text-on-surface">
              {t("essentialTitle")}
            </p>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t("essentialDescription")}
            </p>
          </div>
          <span className="shrink-0 font-label text-label text-text-secondary">
            {t("essentialAlwaysOn")}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-border-standard pt-4">
          <div>
            <p className="font-label text-label font-semibold text-on-surface">
              {t("analyticsTitle")}
            </p>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t("analyticsDescription")}
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="sr-only">{t("analyticsTitle")}</span>
          </label>
        </div>
      </div>

      {showActions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={() => void save("save_preferences")}>
            {t("savePreferences")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void save("accept_all")}
          >
            {t("acceptAll")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void save("reject_non_essential")}
          >
            {t("rejectNonEssential")}
          </Button>
        </div>
      ) : null}

      <p className="text-body-sm">
        <Link
          href="/cookies"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("policyLink")}
        </Link>
      </p>
    </div>
  );
}
