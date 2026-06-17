"use client";

export function VolumeChart({
  buckets,
  series,
}: {
  buckets: string[];
  series: Array<{ status: string; counts: number[] }>;
}) {
  const totals = buckets.map((_, idx) =>
    series.reduce((sum, item) => sum + (item.counts[idx] ?? 0), 0),
  );
  const max = Math.max(...totals, 1);

  return (
    <div className="space-y-2 rounded-lg border border-staff-border bg-staff-surface p-4">
      {buckets.map((bucket, idx) => {
        const value = totals[idx] ?? 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={bucket} className="space-y-1">
            <div className="flex justify-between text-xs text-staff-text-muted">
              <span>{bucket}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 rounded bg-staff-bg">
              <div
                className="h-2 rounded bg-staff-nav-active"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
