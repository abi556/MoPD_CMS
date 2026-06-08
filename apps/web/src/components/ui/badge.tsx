import type { ReactNode } from "react";

const tones = {
  neutral: "bg-surface-container-low text-on-surface",
  brand: "bg-primary-container text-on-primary-container",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
