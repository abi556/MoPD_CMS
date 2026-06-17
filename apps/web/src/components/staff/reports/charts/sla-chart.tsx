"use client";

export function SlaChart({
  onTimePct,
  breachedPct,
}: {
  onTimePct: number;
  breachedPct: number;
}) {
  const onTimeWidth = Math.max(0, Math.min(100, onTimePct));
  const breachedWidth = Math.max(0, Math.min(100, breachedPct));

  return (
    <div className="rounded-lg border border-staff-border bg-staff-surface p-4">
      <p className="mb-2 text-sm font-medium text-staff-text">SLA mix</p>
      <div className="h-3 overflow-hidden rounded bg-staff-bg">
        <div className="flex h-3 w-full">
          <div
            className="bg-green-600"
            style={{ width: `${onTimeWidth}%` }}
            aria-label={`On time ${onTimePct}%`}
          />
          <div
            className="bg-red-600"
            style={{ width: `${breachedWidth}%` }}
            aria-label={`Breached ${breachedPct}%`}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-staff-text-muted">
        <span>On time: {onTimePct}%</span>
        <span>Breached: {breachedPct}%</span>
      </div>
    </div>
  );
}
