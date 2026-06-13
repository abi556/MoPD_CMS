"use client";

import type { ComplaintListItem } from "@/lib/staff/complaints-api";
import type { ComplaintSlaStatus } from "@/lib/staff/sla-status";
import { mapSlaToState } from "@/lib/staff/sla-status";
import { Link } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { StatusBadge, SlaBadge } from "@/components/ui/status-badge";
import { useTranslations } from "next-intl";

interface ComplaintQueueCardProps {
  row: ComplaintListItem;
  assigneeLabel: string;
  sla: ComplaintSlaStatus | null;
}

export function ComplaintQueueCard({
  row,
  assigneeLabel,
  sla,
}: ComplaintQueueCardProps) {
  const t = useTranslations("complaints.queue");
  const slaState = mapSlaToState(sla);

  return (
    <Link
      href={staffRoutes.complaintDetail(row.id)}
      className="block cursor-pointer rounded-xl border border-staff-border bg-staff-surface p-4 transition-colors hover:border-staff-nav-active-bg md:hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold text-staff-text">
            {row.referenceNo}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-staff-text-muted">
            {row.subject}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-staff-text-muted">
        <span>{new Date(row.submittedAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>
          {t("assignee")}: {assigneeLabel}
        </span>
        <SlaBadge state={slaState} />
      </div>
    </Link>
  );
}
