"use client";

import type { ReactNode } from "react";
import { hasAnalyticsConsent } from "@/lib/public/cookie-consent";

/**
 * Renders children only when the user has opted in to analytics cookies.
 * Wire third-party scripts (GA, Sentry browser, etc.) inside this gate.
 */
export function AnalyticsGate({ children }: { children: ReactNode }) {
  if (!hasAnalyticsConsent()) {
    return null;
  }
  return <>{children}</>;
}
