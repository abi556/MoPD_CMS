"use client";

import { useTranslations } from "next-intl";

const LEGEND = [
  { key: "open", color: "bg-[var(--staff-kpi-primary-from)]" },
  { key: "triage", color: "bg-[var(--staff-kpi-secondary-from)]" },
  { key: "qa", color: "bg-[var(--staff-kpi-tertiary-from)]" },
  { key: "sla", color: "bg-[var(--staff-kpi-warning-from)]" },
] as const;

export function DashboardChartPlaceholder() {
  const t = useTranslations("staff.dashboard");

  return (
    <div className="rounded-xl border border-staff-border bg-staff-surface p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-staff-text">{t("chartTitle")}</h2>
          <p className="mt-1 text-sm text-staff-text-muted">{t("chartSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {LEGEND.map(({ key, color }) => (
            <div key={key} className="flex items-center gap-2 text-xs text-staff-text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {t(`legend.${key}`)}
            </div>
          ))}
        </div>
      </div>
      <div className="relative h-64 overflow-hidden rounded-lg border border-staff-border bg-staff-input-bg">
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-t border-dashed border-staff-border" />
          ))}
        </div>
        <svg
          viewBox="0 0 400 120"
          className="absolute inset-x-4 bottom-4 top-8 w-[calc(100%-2rem)] text-staff-nav-active"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,90 C40,70 80,95 120,60 S200,30 240,50 S320,20 400,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />
          <path
            d="M0,100 C50,85 100,110 150,75 S250,55 300,70 S350,45 400,55"
            fill="none"
            stroke="var(--staff-kpi-secondary-from)"
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-staff-text-muted">
          {t("chartPlaceholder")}
        </p>
      </div>
    </div>
  );
}
