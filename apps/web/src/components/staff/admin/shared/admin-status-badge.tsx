import type { ReactNode } from "react";

export function AdminStatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-success/15 text-success"
          : "bg-surface-container-highest text-text-secondary"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function AdminErrorAlert({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}
