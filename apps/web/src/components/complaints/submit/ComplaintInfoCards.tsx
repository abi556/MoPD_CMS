"use client";

import { useTranslations } from "next-intl";
import { Info, ShieldCheck } from "lucide-react";

export function ComplaintInfoCards() {
  const t = useTranslations("complaintSubmit");

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 animate-fade-in-up [animation-delay:250ms] fill-mode-both">
      <div className="flex items-start gap-4 rounded-none border border-border-standard bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden />
        <div>
          <p className="text-label font-semibold text-on-surface">
            {t("info.privacyTitle")}
          </p>
          <p className="mt-1 text-body-sm text-text-secondary leading-relaxed">
            {t("info.privacyBody")}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 rounded-none border border-border-standard bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="text-label font-semibold text-on-surface">
            {t("info.slaTitle")}
          </p>
          <p className="mt-1 text-body-sm text-text-secondary leading-relaxed">{t("info.slaBody")}</p>
        </div>
      </div>
    </div>
  );
}
