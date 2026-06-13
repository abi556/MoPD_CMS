"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";

export function ComplaintPhase8Stub() {
  const t = useTranslations("complaints.detail");
  return (
    <EmptyState
      title={t("phase8Title")}
      description={t("phase8Description")}
    />
  );
}
