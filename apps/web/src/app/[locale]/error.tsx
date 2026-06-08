"use client";

import { useTranslations } from "next-intl";
import { ErrorScreen } from "@/components/public/error-screen";
import { GenericErrorArt } from "@/components/public/error-illustrations";

export default function LocaleError({
  reset,
}: {
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  const nav = useTranslations("nav");

  return (
    <ErrorScreen
      eyebrow={t("genericEyebrow")}
      title={t("genericTitle")}
      body={t("genericBody")}
      illustration={<GenericErrorArt className="h-auto w-full" />}
      primaryAction={{ label: common("retry"), onClick: reset }}
      secondaryAction={{ href: "/", label: nav("home"), variant: "secondary" }}
    />
  );
}
