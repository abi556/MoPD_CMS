"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SlaBadge } from "@/components/ui/status-badge";
import {
  formatSlaCountdown,
  mapSlaToState,
  type ComplaintSlaStatus,
} from "@/lib/staff/sla-status";

export function SlaCountdown({ sla }: { sla: ComplaintSlaStatus | null }) {
  const t = useTranslations("complaints.sla");
  const [remainingMs, setRemainingMs] = useState(sla?.remainingMs ?? 0);

  useEffect(() => {
    if (!sla) return;
    setRemainingMs(sla.remainingMs);
    const interval = window.setInterval(() => {
      setRemainingMs((prev) => prev - 1000);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sla]);

  if (!sla) {
    return <SlaBadge state="unknown" label={t("unknown")} />;
  }

  const state = mapSlaToState({ ...sla, remainingMs });
  const label = `${t("countdown")}: ${formatSlaCountdown(remainingMs)}`;

  return <SlaBadge state={state} label={label} />;
}
