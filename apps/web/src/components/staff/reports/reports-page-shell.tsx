import type { ReactNode } from "react";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";

/** @deprecated Prefer StaffPageShell directly */
export function ReportsPageShell({
  title,
  subtitle,
  filterBar,
  children,
}: {
  title: string;
  subtitle?: string;
  filterBar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <StaffPageShell title={title} subtitle={subtitle} filterBar={filterBar}>
      {children}
    </StaffPageShell>
  );
}
