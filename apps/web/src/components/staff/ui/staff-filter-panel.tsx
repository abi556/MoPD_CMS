import type { ReactNode } from "react";

export function StaffFilterPanel({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-staff-border bg-staff-surface p-4 md:p-5">
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-staff-text">{title}</h2>
      ) : null}
      {children}
    </div>
  );
}
