import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border-standard bg-surface-container-lowest px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-on-surface">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
