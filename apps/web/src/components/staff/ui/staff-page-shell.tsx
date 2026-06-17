import type { ReactNode } from "react";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";

export function StaffPageShell({
  title,
  subtitle,
  action,
  filterBar,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  filterBar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <DashboardPageHeader title={title} subtitle={subtitle} action={action} />
      {filterBar}
      {children}
    </div>
  );
}
