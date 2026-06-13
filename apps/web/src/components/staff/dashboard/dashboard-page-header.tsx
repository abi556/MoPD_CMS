import type { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-staff-text">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-staff-text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
