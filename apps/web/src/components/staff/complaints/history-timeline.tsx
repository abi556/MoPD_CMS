"use client";

import { useTranslations } from "next-intl";
import { StatusBadge, formatStatusLabel } from "@/components/ui/status-badge";
import type { ComplaintHistoryItem } from "@/lib/staff/complaints-api";
import { EmptyState } from "@/components/ui/empty-state";

export function HistoryTimeline({ items }: { items: ComplaintHistoryItem[] }) {
  const t = useTranslations("complaints.history");

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-staff-border pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-staff-nav-active-bg" />
          <div className="rounded-xl border border-staff-border bg-staff-surface p-4">
            <p className="text-sm font-semibold text-staff-text">
              {item.action === "ASSIGNED" ? t("assigned") : t("transitioned")}
            </p>
            <p className="mt-1 text-xs text-staff-text-muted">
              {new Date(item.createdAt).toLocaleString()}
            </p>
            {item.fromStatus ? (
              <p className="mt-2 text-sm text-staff-text">
                {t("from")}:{" "}
                <StatusBadge status={item.fromStatus} className="ml-1" />
              </p>
            ) : null}
            <p className="mt-1 text-sm text-staff-text">
              {t("to")}: <StatusBadge status={item.toStatus} className="ml-1" />
            </p>
            {item.reason ? (
              <p className="mt-2 text-sm text-staff-text-muted">
                {t("reason")}: {item.reason}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-staff-text-muted">
              {formatStatusLabel(item.toStatus)} · {item.actorUserId}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
