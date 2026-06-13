"use client";

import { useTranslations } from "next-intl";

const TABS = [
  { id: "overview", active: true },
  { id: "byStatus", active: false },
  { id: "byChannel", active: false },
  { id: "byOrgUnit", active: false },
] as const;

export function DashboardTabs() {
  const t = useTranslations("staff.dashboard");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={!tab.active}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab.active
              ? "bg-staff-nav-active-bg text-staff-nav-active-text"
              : "cursor-not-allowed text-staff-text-muted opacity-60"
          }`}
        >
          {t(`tabs.${tab.id}`)}
        </button>
      ))}
    </div>
  );
}
