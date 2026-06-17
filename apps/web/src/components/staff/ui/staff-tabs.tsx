"use client";

export interface StaffTabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export function StaffTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel,
}: {
  tabs: StaffTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/30 ${
              active
                ? "bg-staff-nav-active-bg text-staff-nav-active-text shadow-sm"
                : tab.disabled
                  ? "cursor-not-allowed text-staff-text-muted opacity-60"
                  : "cursor-pointer text-staff-text-muted hover:bg-staff-nav-hover hover:text-staff-text"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
