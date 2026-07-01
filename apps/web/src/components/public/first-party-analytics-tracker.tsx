"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ANALYTICS_CONSENT_EVENT,
} from "@/lib/public/web-analytics-constants";
import {
  flushAnalyticsQueue,
  trackPageView,
} from "@/lib/public/web-analytics";
import { hasAnalyticsConsent } from "@/lib/public/cookie-consent";

/**
 * Consent-gated first-party analytics: page views and queued event flush.
 */
export function FirstPartyAnalyticsTracker() {
  const pathname = usePathname();
  const locale = useLocale() as "en" | "am";

  useEffect(() => {
    const onConsentUpdated = () => {
      if (hasAnalyticsConsent()) {
        trackPageView(pathname, locale);
        void flushAnalyticsQueue();
      }
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsentUpdated);
    const onUnload = () => {
      void flushAnalyticsQueue();
    };
    window.addEventListener("pagehide", onUnload);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsentUpdated);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [pathname, locale]);

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    trackPageView(pathname, locale);
  }, [pathname, locale]);

  return null;
}
