"use client";

import { Calendar, ChevronRight, User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComplaintListItem } from "@/lib/staff/complaints-api";
import type { ComplaintSlaStatus } from "@/lib/staff/sla-status";
import { mapSlaToState } from "@/lib/staff/sla-status";
import { Link } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { StatusBadge, SlaBadge } from "@/components/ui/status-badge";

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
  const submitted = new Date(row.submittedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={staffRoutes.complaintDetail(row.id)}
      className="group block cursor-pointer rounded-xl border border-staff-border/40 bg-staff-surface p-4 shadow-staff-card transition-all duration-200 hover:-translate-y-0.5 hover:border-staff-nav-active/25 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:hidden"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold tracking-wide text-staff-nav-active">
            {row.referenceNo}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-staff-text">
            {row.subject}
          </p>
        </div>
        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-staff-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-staff-nav-active"
          aria-hidden
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={row.status} />
        <SlaBadge state={slaState} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-staff-border/30 pt-3 text-xs text-staff-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {submitted}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {t("assignee")}: {assigneeLabel}
          </span>
        </span>
      </div>
    </Link>
  );
}
