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
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { ComplaintQueueFiltersBar } from "@/components/staff/complaints/complaint-queue-filters";
import { ComplaintQueueCard } from "@/components/staff/complaints/complaint-queue-card";
import { StatusBadge, SlaBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";

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
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />

      {isScopedOfficer ? (
        <p className="mb-4 rounded-xl border border-staff-border bg-staff-surface px-4 py-3 text-sm text-staff-text-muted">
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
        {!loading &&
          rows.map((row) => (
            <ComplaintQueueCard
              key={row.id}
              row={row}
              assigneeLabel={assigneeLabel(row.assignedToUserId)}
              sla={slaMap.get(row.id) ?? null}
            />
          ))}
      </div>

      <div className="hidden md:block">
        <StaffDataTable
          columns={[
            {
              id: "reference",
              header: t("reference"),
              cell: (row) => (
                <Link
                  href={staffRoutes.complaintDetail(row.id)}
                  className="cursor-pointer font-mono text-sm font-medium text-staff-nav-active hover:underline"
                >
                  {row.referenceNo}
                </Link>
              ),
            },
            {
              id: "status",
              header: t("status"),
              cell: (row) => <StatusBadge status={row.status} />,
            },
            {
              id: "subject",
              header: t("subject"),
              cell: (row) => (
                <span className="line-clamp-1 max-w-md">{row.subject}</span>
              ),
            },
            {
              id: "submittedAt",
              header: t("submittedAt"),
              cell: (row) => new Date(row.submittedAt).toLocaleString(),
            },
            {
              id: "assignee",
              header: t("assignee"),
              cell: (row) => assigneeLabel(row.assignedToUserId),
            },
            {
              id: "sla",
              header: t("sla"),
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
