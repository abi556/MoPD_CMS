"use client";

import { useTranslations } from "next-intl";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const t = useTranslations("nav-staff");
  const online = useOnlineStatus();

  if (online) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-warning/40 bg-warning/15 px-4 py-2 text-center text-sm font-medium text-staff-text motion-safe:animate-pulse"
    >
      {t("offlineBanner")}
    </div>
  );
}
