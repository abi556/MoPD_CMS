"use client";

export function ChannelsChart({
  channels,
}: {
  channels: Array<{ channel: string; count: number }>;
}) {
  const max = Math.max(...channels.map((c) => c.count), 1);
  return (
    <div className="space-y-2 rounded-lg border border-staff-border bg-staff-surface p-4">
      {channels.map((item) => {
        const pct = Math.round((item.count / max) * 100);
        return (
          <div key={item.channel} className="space-y-1">
            <div className="flex justify-between text-xs text-staff-text-muted">
              <span>{item.channel}</span>
              <span>{item.count}</span>
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
