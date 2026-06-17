import type { ReactNode } from "react";

export function StaffEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-staff-border bg-staff-shell/40 px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-staff-text">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-staff-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
