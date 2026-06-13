const VARIANT_CLASS = {
  primary:
    "from-[var(--staff-kpi-primary-from)] to-[var(--staff-kpi-primary-to)]",
  secondary:
    "from-[var(--staff-kpi-secondary-from)] to-[var(--staff-kpi-secondary-to)]",
  tertiary:
    "from-[var(--staff-kpi-tertiary-from)] to-[var(--staff-kpi-tertiary-to)]",
  warning:
    "from-[var(--staff-kpi-warning-from)] to-[var(--staff-kpi-warning-to)]",
} as const;

export type KpiStatVariant = keyof typeof VARIANT_CLASS;

export function KpiStatCard({
  label,
  value,
  hint,
  delta,
  variant = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  variant?: KpiStatVariant;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white shadow-sm ${VARIANT_CLASS[variant]}`}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <p className="text-sm font-medium text-white/85">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {delta ? (
        <p className="mt-2 text-xs text-white/75">{delta}</p>
      ) : hint ? (
        <p className="mt-2 text-xs text-white/75" title={hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function KpiStatCardSkeleton() {
  return (
    <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-staff-nav-hover" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-staff-nav-hover" />
    </div>
  );
}
