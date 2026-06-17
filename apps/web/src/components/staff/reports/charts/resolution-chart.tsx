"use client";

export function ResolutionChart({
  byBucket,
}: {
  byBucket: Array<{ bucket: string; avgResolutionHours: number | null }>;
}) {
  const values = byBucket.map((b) => b.avgResolutionHours ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-2 rounded-lg border border-staff-border bg-staff-surface p-4">
      {byBucket.map((item) => {
        const value = item.avgResolutionHours ?? 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={item.bucket} className="space-y-1">
            <div className="flex justify-between text-xs text-staff-text-muted">
              <span>{item.bucket}</span>
              <span>{value.toFixed(1)} h</span>
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
