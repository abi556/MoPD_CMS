"use client";

import { useStaffThemeOptional } from "@/components/staff/theme/staff-theme-provider";

/** Full-viewport placeholder shown while staff session is restored after hard refresh. */
export function StaffAuthLoadingShell() {
  const { resolvedTheme } = useStaffThemeOptional();

  return (
    <div
      className="staff-shell flex min-h-screen bg-staff-shell font-body text-staff-text antialiased"
      data-theme={resolvedTheme}
      suppressHydrationWarning
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading staff console"
    >
      <div className="hidden w-sidebar-wide shrink-0 border-r border-staff-border bg-staff-sidebar md:block" />
      <div className="flex flex-1 flex-col p-margin-mobile md:p-gutter">
        <div className="staff-skeleton h-10 w-full max-w-xs rounded-lg" />
        <div className="staff-skeleton mt-6 h-32 w-full rounded-xl" />
        <div className="staff-skeleton mt-4 h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
