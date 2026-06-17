import type { ReactNode } from "react";

export function StaffSurfaceCard({
  title,
  subtitle,
  footer,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-staff-border bg-staff-surface p-5 md:p-6 ${className}`}
    >
      {title ? (
        <header className={children ? "mb-4" : undefined}>
          <h2 className="font-display text-xl font-semibold text-staff-text">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-staff-text-muted">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      {children}
      {footer ? <footer className="mt-4 border-t border-staff-border pt-4">{footer}</footer> : null}
    </section>
  );
}
