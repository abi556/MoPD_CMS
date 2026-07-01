"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CookiePreferencesPanel } from "@/components/public/cookie-preferences-panel";
import {
  acceptAllCookies,
  dismissCookieNotice,
  getStoredConsent,
  rejectNonEssentialCookies,
  shouldShowCookieNotice,
} from "@/lib/public/cookie-consent";
import { logCookieConsentToServer } from "@/lib/public/cookie-consent-api";

export function CookieNotice() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    setVisible(shouldShowCookieNotice());
  }, []);

  if (!visible) {
    return null;
  }

  const close = () => {
    setVisible(false);
    setShowPreferences(false);
  };

  const handleDismissEssentialOnly = async () => {
    dismissCookieNotice();
    await logCookieConsentToServer(
      "reject_non_essential",
      { essential: true, analytics: false },
      locale,
    );
    close();
  };

  const handleAcceptAll = async () => {
    const stored = acceptAllCookies();
    await logCookieConsentToServer("accept_all", stored.categories, locale);
    close();
  };

  const handleReject = async () => {
    const stored = rejectNonEssentialCookies();
    await logCookieConsentToServer(
      "reject_non_essential",
      stored.categories,
      locale,
    );
    close();
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-body"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto max-w-max-width rounded-xl border border-border-standard bg-surface-container-lowest p-3 shadow-xl md:bottom-6 md:left-6 md:right-6 md:p-4"
    >
      <div className="flex w-full flex-col gap-3">
        {!showPreferences ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="min-w-0 flex-1">
              <h2
                id="cookie-notice-title"
                className="text-sm font-semibold text-on-background md:text-base"
              >
                {t("noticeTitle")}
              </h2>
              <p
                id="cookie-notice-body"
                className="mt-1 text-xs leading-snug text-text-secondary md:text-body-sm"
              >
                {t("noticeBody")}{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {t("policyLink")}
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 md:justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => void handleAcceptAll()}
              >
                {t("acceptAll")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void handleReject()}
              >
                {t("rejectNonEssential")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-8 px-2"
                onClick={() => setShowPreferences(true)}
              >
                {t("managePreferences")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-8 px-2"
                onClick={() => void handleDismissEssentialOnly()}
              >
                {t("dismiss")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-on-background md:text-base">
              {t("preferencesTitle")}
            </h2>
            <CookiePreferencesPanel
              initialAnalytics={getStoredConsent()?.categories.analytics ?? false}
              onSaved={close}
            />
          </>
        )}
      </div>
    </div>
  );
}
