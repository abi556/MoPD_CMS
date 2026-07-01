"use client";

import { AnalyticsGate } from "@/components/public/analytics-gate";
import { FirstPartyAnalyticsTracker } from "@/components/public/first-party-analytics-tracker";

/**
 * First-party analytics and optional third-party scripts load only after
 * the user opts in via cookie preferences (PDPP 1321/2024).
 */
export function AnalyticsScripts() {
  return (
    <AnalyticsGate>
      <FirstPartyAnalyticsTracker />
    </AnalyticsGate>
  );
}
