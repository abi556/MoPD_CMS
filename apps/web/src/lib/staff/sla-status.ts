import type { SlaState } from "@/components/ui/status-badge";

export interface ComplaintSlaStatus {
  complaintId: string;
  slaConfigName: string;
  status: string;
  startedAt: string;
  targetAt: string;
  warningAt: string;
  warnedAt?: string | null;
  breachedAt?: string | null;
  completedAt?: string | null;
  remainingMs: number;
  isWarned: boolean;
  isBreached: boolean;
}

export function mapSlaToState(sla: ComplaintSlaStatus | null | undefined): SlaState {
  if (!sla) return "unknown";
  if (sla.isBreached || sla.status === "BREACHED") return "breached";
  if (sla.isWarned || sla.status === "PAUSED") return "at_risk";
  if (sla.status === "COMPLETED") return "on_track";
  if (sla.remainingMs <= 0) return "breached";
  const warningMs = new Date(sla.warningAt).getTime() - Date.now();
  if (warningMs <= 0) return "at_risk";
  return "on_track";
}

export function formatSlaCountdown(remainingMs: number): string {
  if (remainingMs <= 0) {
    const overdue = Math.abs(remainingMs);
    return formatDuration(overdue, true);
  }
  return formatDuration(remainingMs, false);
}

function formatDuration(ms: number, overdue: boolean): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  let label: string;
  if (days > 0) {
    label = `${days}d ${remHours}h`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m`;
  } else {
    label = `${minutes}m`;
  }
  return overdue ? `${label} overdue` : label;
}
