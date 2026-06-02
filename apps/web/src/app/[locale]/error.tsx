"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LocaleError({
  reset,
}: {
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-on-surface">
          {t("genericTitle")}
        </h1>
        <p className="mt-3 text-sm text-text-secondary">{t("genericBody")}</p>
        <div className="mt-6">
          <Button type="button" onClick={reset}>
            {common("retry")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
