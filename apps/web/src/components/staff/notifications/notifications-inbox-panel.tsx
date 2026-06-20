"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  listInAppNotifications,
  markAllNotificationsRead,
  type InAppNotificationItem,
} from "@/lib/staff/in-app-notifications-api";
import { groupNotificationsByDate } from "@/lib/staff/inbox-notifications";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { Button } from "@/components/ui/button";
import { NotificationListItem } from "./notification-list-item";
import { useUnreadNotificationCount } from "./unread-notification-count-context";

const PAGE_SIZE = 20;

export function NotificationsInboxPanel() {
  const t = useTranslations("inbox");
  const { refresh: refreshBadge } = useUnreadNotificationCount();
  const [rows, setRows] = useState<InAppNotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [markingAll, setMarkingAll] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await listInAppNotifications({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly,
      });
      setRows(res.data);
      setTotalPages(res.meta.totalPages);
      await refreshBadge();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loadError"));
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly, t, refreshBadge]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await fetchRows();
      await refreshBadge();
    } finally {
      setMarkingAll(false);
    }
  };

  const grouped = groupNotificationsByDate(rows);
  const groupLabels = {
    today: t("groupToday"),
    yesterday: t("groupYesterday"),
    earlier: t("groupEarlier"),
  } as const;
  const emptyTitle = unreadOnly ? t("emptyUnreadTitle") : t("emptyTitle");
  const emptyDescription = unreadOnly
    ? t("emptyUnreadDescription")
    : t("emptyDescription");

  return (
    <StaffPageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-staff-border p-1">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors ${
              !unreadOnly
                ? "bg-staff-nav-hover text-staff-nav-active"
                : "text-staff-text-muted hover:text-staff-text"
            }`}
          >
            {t("filterAll")}
          </button>
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors ${
              unreadOnly
                ? "bg-staff-nav-hover text-staff-nav-active"
                : "text-staff-text-muted hover:text-staff-text"
            }`}
          >
            {t("filterUnread")}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={markingAll || loading}
          onClick={() => void handleMarkAllRead()}
        >
          {t("markAllRead")}
        </Button>
      </div>

      {error ? (
        <StaffAlert variant="error" className="mb-4">
          {error}{" "}
          <button
            type="button"
            className="cursor-pointer underline"
            onClick={() => void fetchRows()}
          >
            {t("retry")}
          </button>
        </StaffAlert>
      ) : null}

      {loading ? (
        <div className="min-h-[240px] space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-staff-nav-hover/40"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="min-h-[240px] rounded-lg border border-dashed border-staff-border p-8 text-center">
          <p className="text-base font-medium text-staff-text">{emptyTitle}</p>
          <p className="mt-2 text-sm text-staff-text-muted">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ group, items }) => (
            <section key={group}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-staff-text-muted">
                {groupLabels[group]}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <NotificationListItem
                    key={item.id}
                    item={item}
                    onRead={() => void refreshBadge()}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-staff-text-muted">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </StaffPageShell>
  );
}
