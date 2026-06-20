"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  applyQueuePreset,
  parseComplaintFiltersFromSearch,
  serializeComplaintFilters,
  type ComplaintQueueFilters,
} from "@/lib/staff/complaint-filters";
import {
  fetchSlaBatch,
  listComplaints,
  type ComplaintListItem,
} from "@/lib/staff/complaints-api";
import { listUsers } from "@/lib/staff/users-api";
import type { ComplaintSlaStatus } from "@/lib/staff/sla-status";
import { mapSlaToState } from "@/lib/staff/sla-status";
import { hasExactPermission, hasPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { StaffDataTable } from "@/components/staff/ui/staff-data-table";
import { StaffEmptyState } from "@/components/staff/ui/staff-empty-state";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { ComplaintQueueFiltersBar } from "@/components/staff/complaints/complaint-queue-filters";
import { ComplaintQueueCard } from "@/components/staff/complaints/complaint-queue-card";
import { StatusBadge, SlaBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";

const PAGE_SIZE = 20;

export function ComplaintsQueuePanel() {
  const t = useTranslations("complaints.queue");
  const tc = useTranslations("admin.common");
  const { user } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<ComplaintListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();
  const [slaMap, setSlaMap] = useState<Map<string, ComplaintSlaStatus | null>>(
    new Map(),
  );
  const [userEmails, setUserEmails] = useState<Map<string, string>>(new Map());

  const filters = useMemo((): ComplaintQueueFilters => {
    return parseComplaintFiltersFromSearch(
      new URLSearchParams(searchParams.toString()),
    );
  }, [searchParams]);

  const isScopedOfficer =
    user &&
    hasExactPermission(user.permissions, "complaint:read:own") &&
    !hasPermission(user.permissions, "complaint:read");

  const canCreateAssisted =
    user &&
    hasPermission(user.permissions, "workflow:transition") &&
    (hasPermission(user.permissions, "complaint:read") ||
      hasPermission(user.permissions, "complaint:read:own") ||
      hasPermission(user.permissions, "complaint:recovery:manage"));

  const syncUrl = useCallback(
    (next: ComplaintQueueFilters) => {
      const query = serializeComplaintFilters(next);
      const qs = new URLSearchParams(query).toString();
      router.replace(
        qs ? `${staffRoutes.complaints}?${qs}` : staffRoutes.complaints,
      );
    },
    [router],
  );

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    const resolved = applyQueuePreset(filters);
    try {
      const res = await listComplaints({
        page: resolved.page,
        pageSize: resolved.pageSize ?? PAGE_SIZE,
        status: resolved.status,
        channel: resolved.channel,
        locale: resolved.locale,
        submittedFrom: resolved.submittedFrom,
        submittedTo: resolved.submittedTo,
        q: resolved.q,
      });
      setRows(res.data);
      setTotal(res.meta.total);

      const sla = await fetchSlaBatch(res.data.map((r) => r.id));
      setSlaMap(sla);

      if (user && hasPermission(user.permissions, "user:manage")) {
        const usersRes = await listUsers({ page: 1, pageSize: 100, isActive: true });
        setUserEmails(new Map(usersRes.data.map((u) => [u.id, u.email])));
      }
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, tc, user]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const assigneeLabel = (id: string | null) => {
    if (!id) return t("unassigned");
    if (user?.id === id) return user.email;
    return userEmails.get(id) ?? id.slice(0, 8);
  };

  return (
    <div>
      <DashboardPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          canCreateAssisted ? (
            <Link
              href={staffRoutes.complaintsNew}
              className={buttonClassName({ variant: "brand", className: "min-h-11" })}
            >
              {t("newComplaint")}
            </Link>
          ) : null
        }
      />

      {isScopedOfficer ? (
        <p className="mb-4 rounded-xl border border-staff-nav-active/15 bg-staff-nav-active-bg/8 px-4 py-2.5 text-sm text-staff-text-muted">
          {t("scopedHint")}
        </p>
      ) : null}

      <ComplaintQueueFiltersBar
        filters={filters}
        onChange={syncUrl}
      />

      {listError ? (
        <div className="mb-4">
          <StaffAlert>{listError}</StaffAlert>
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skel-card-${i}`}
                className="h-28 animate-pulse rounded-xl border border-staff-border/30 bg-staff-surface"
              />
            ))
          : null}
        {!loading &&
          rows.map((row) => (
            <ComplaintQueueCard
              key={row.id}
              row={row}
              assigneeLabel={assigneeLabel(row.assignedToUserId)}
              sla={slaMap.get(row.id) ?? null}
            />
          ))}
        {!loading && rows.length === 0 ? (
          <StaffEmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : null}
      </div>

      <div className="hidden md:block">
        <StaffDataTable
          columns={[
            {
              id: "reference",
              header: t("reference"),
              className: "w-[8.5rem] whitespace-nowrap",
              cell: (row) => (
                <Link
                  href={staffRoutes.complaintDetail(row.id)}
                  className="cursor-pointer font-mono text-xs font-semibold text-staff-nav-active hover:underline"
                >
                  {row.referenceNo}
                </Link>
              ),
            },
            {
              id: "status",
              header: t("status"),
              className: "w-[9rem]",
              cell: (row) => <StatusBadge status={row.status} />,
            },
            {
              id: "subject",
              header: t("subject"),
              className: "min-w-[12rem] max-w-[20rem]",
              cell: (row) => (
                <span className="line-clamp-2 text-sm leading-snug text-staff-text">
                  {row.subject}
                </span>
              ),
            },
            {
              id: "submittedAt",
              header: t("submittedAt"),
              className: "w-[9rem] whitespace-nowrap text-staff-text-muted",
              cell: (row) =>
                new Date(row.submittedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
            },
            {
              id: "assignee",
              header: t("assignee"),
              className: "max-w-[10rem]",
              cell: (row) => (
                <span className="block truncate text-staff-text-muted">
                  {assigneeLabel(row.assignedToUserId)}
                </span>
              ),
            },
            {
              id: "sla",
              header: t("sla"),
              className: "w-[7.5rem]",
              cell: (row) => (
                <SlaBadge state={mapSlaToState(slaMap.get(row.id) ?? null)} />
              ),
            },
          ]}
          rows={rows}
          rowKey={(row) => row.id}
          page={filters.page}
          pageSize={filters.pageSize ?? PAGE_SIZE}
          total={total}
          onPageChange={(page) => syncUrl({ ...filters, page })}
          loading={loading}
          emptyTitle={t("emptyTitle")}
          emptyDescription={t("emptyDescription")}
        />
      </div>
    </div>
  );
}
