"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/components/auth/permission-gate";
import { DashboardSidePager } from "@/components/staff/dashboard/dashboard-pager";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  categoryDisplayName,
  fetchDashboardInsights,
  formatRelativeTime,
  pageCount,
  paginateItems,
  QUEUE_ACTIVITY_PAGE_SIZE,
  topCategoryMax,
  type DashboardInsights,
  type QueueActivityItem,
} from "@/lib/staff/dashboard-insights";
import { staffRoutes } from "@/lib/staff/routes";

function InsightsCardSkeleton() {
  return (
    <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
      <div className="h-5 w-40 animate-pulse rounded bg-staff-nav-hover" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-staff-nav-hover" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-staff-nav-hover" />
        ))}
      </div>
    </div>
  );
}

function TopCategoriesCard({
  categories,
  locale,
}: {
  categories: DashboardInsights["topCategories"];
  locale: string;
}) {
  const t = useTranslations("staff.dashboard");
  const max = topCategoryMax(categories);

  if (categories.length === 0) {
    return (
      <EmptyState
        title={t("insights.noCategories")}
        description={t("insights.noCategoriesHint")}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {categories.map((category) => (
        <li key={category.categoryId}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-staff-text">
              {categoryDisplayName(category, locale)}
            </span>
            <span className="shrink-0 tabular-nums text-staff-text-muted">
              {category.count}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-staff-nav-hover">
            <div
              className="h-full rounded-full bg-staff-nav-active"
              style={{ width: `${(category.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function QueueActivityRow({
  event,
  locale,
  label,
}: {
  event: QueueActivityItem;
  locale: string;
  label: string;
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <Link
          href={staffRoutes.complaintDetail(event.complaintId)}
          className="font-medium text-staff-nav-active hover:underline"
        >
          {event.referenceNo}
        </Link>
        <p className="mt-0.5 truncate text-sm text-staff-text-muted">
          {event.subject}
        </p>
        <p className="mt-1 text-xs text-staff-text-muted">{label}</p>
      </div>
      <time
        dateTime={event.createdAt}
        className="shrink-0 text-xs text-staff-text-muted"
      >
        {formatRelativeTime(event.createdAt, locale)}
      </time>
    </li>
  );
}

function QueueActivityCard({
  events,
  locale,
}: {
  events: DashboardInsights["queueActivity"];
  locale: string;
}) {
  const t = useTranslations("staff.dashboard");
  const [page, setPage] = useState(0);
  const totalPages = pageCount(events.length, QUEUE_ACTIVITY_PAGE_SIZE);
  const visibleEvents = useMemo(
    () => paginateItems(events, page, QUEUE_ACTIVITY_PAGE_SIZE),
    [events, page],
  );

  useEffect(() => {
    setPage(0);
  }, [events]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  if (events.length === 0) {
    return (
      <EmptyState
        title={t("insights.noQueueActivity")}
        description={t("insights.noQueueActivityHint")}
      />
    );
  }

  const activityList = (
    <ul className="divide-y divide-staff-border">
      {visibleEvents.map((event) => {
        const label =
          event.action === "ASSIGNED"
            ? t("insights.eventAssigned")
            : t("insights.eventTriage");

        return (
          <QueueActivityRow
            key={event.id}
            event={event}
            locale={locale}
            label={label}
          />
        );
      })}
    </ul>
  );

  return (
    <div>
      {totalPages > 1 ? (
        <div className="mb-2 flex justify-end">
          <span className="text-xs tabular-nums text-staff-text-muted">
            {page + 1}/{totalPages}
          </span>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <DashboardSidePager
          align="end"
          previousLabel={t("insights.queuePrevious")}
          nextLabel={t("insights.queueNext")}
          previousDisabled={page === 0}
          nextDisabled={page >= totalPages - 1}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() =>
            setPage((current) => Math.min(totalPages - 1, current + 1))
          }
        >
          {activityList}
        </DashboardSidePager>
      ) : (
        activityList
      )}
    </div>
  );
}

export function DashboardBottomCards() {
  const t = useTranslations("staff.dashboard");
  const locale = useLocale();
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchDashboardInsights();
      setInsights(data);
    } catch {
      setError(true);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void load();
  }, [load]);

  if (loading) {
    return (
      <PermissionGate match="any" permissions={["complaint:read", "complaint:read:own"]}>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <InsightsCardSkeleton />
          <InsightsCardSkeleton />
        </div>
      </PermissionGate>
    );
  }

  if (error) {
    return (
      <PermissionGate match="any" permissions={["complaint:read", "complaint:read:own"]}>
        <div className="mt-6 rounded-xl border border-staff-border bg-staff-surface p-6">
          <p className="text-danger">{t("error")}</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}>
            {t("retry")}
          </Button>
        </div>
      </PermissionGate>
    );
  }

  return (
    <PermissionGate match="any" permissions={["complaint:read", "complaint:read:own"]}>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
          <h3 className="font-semibold text-staff-text">{t("topCategories")}</h3>
          <p className="mt-1 text-sm text-staff-text-muted">{t("topCategoriesHint")}</p>
          <div className="mt-4">
            <TopCategoriesCard
              categories={insights?.topCategories ?? []}
              locale={locale}
            />
          </div>
        </div>
        <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
          <h3 className="font-semibold text-staff-text">{t("recentQueue")}</h3>
          <p className="mt-1 text-sm text-staff-text-muted">{t("recentQueueHint")}</p>
          <div className="mt-4">
            <QueueActivityCard
              events={insights?.queueActivity ?? []}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
