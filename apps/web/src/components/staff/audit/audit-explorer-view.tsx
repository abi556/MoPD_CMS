"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  buildAuditLogsExportUrl,
  listAuditLogs,
  type AuditLogFilters,
  type AuditLogItem,
} from "@/lib/staff/audit-api";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import {
  StaffCursorPagination,
  StaffDataTable,
  type DataTableColumn,
} from "@/components/staff/ui/staff-data-table";
import { StaffFilterPanel } from "@/components/staff/ui/staff-filter-panel";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";

function defaultFilters(): AuditLogFilters {
  return { limit: 20 };
}

export function AuditExplorerView() {
  const t = useTranslations("admin.audit");
  const [filters, setFilters] = useState<AuditLogFilters>(() => defaultFilters());
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([undefined]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<AuditLogItem | null>(null);

  const currentCursor = cursorStack[cursorStack.length - 1];

  const eventTypeOptions = useMemo(
    () => [
      { value: "", label: t("allEvents") },
      { value: "auth.login.succeeded", label: t("events.authLoginSucceeded") },
      { value: "complaint.transitioned", label: t("events.complaintTransitioned") },
      { value: "report.export.requested", label: t("events.reportExportRequested") },
    ],
    [t],
  );

  const columns: DataTableColumn<AuditLogItem>[] = useMemo(
    () => [
      {
        id: "event",
        header: t("event"),
        cell: (log) => log.eventType,
      },
      {
        id: "actor",
        header: t("actor"),
        cell: (log) => log.actorUserId ?? "—",
      },
      {
        id: "entity",
        header: t("entity"),
        cell: (log) =>
          `${log.entityType ?? "—"}${log.entityId ? ` (${log.entityId})` : ""}`,
      },
      {
        id: "created",
        header: t("created"),
        cell: (log) => new Date(log.createdAt).toLocaleString(),
      },
      {
        id: "details",
        header: t("details"),
        cell: (log) => (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => setSelected(log)}
          >
            {t("view")}
          </Button>
        ),
      },
    ],
    [t],
  );

  const fetchPage = async (cursor?: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await listAuditLogs({
        ...filters,
        cursor,
      });
      setLogs(response.data);
      setHasNext(response.meta.hasNext);
      setNextCursor(response.meta.nextCursor ?? undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPage(currentCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCursor]);

  const exportUrl = useMemo(
    () => buildAuditLogsExportUrl(filters),
    [filters],
  );

  return (
    <StaffPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      action={
        <a href={exportUrl} target="_blank" rel="noreferrer">
          <Button type="button" className="min-h-11">
            <Download size={16} aria-hidden className="mr-2" />
            {t("exportCsv")}
          </Button>
        </a>
      }
      filterBar={
        <StaffFilterPanel>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Select
              label={t("eventType")}
              name="eventType"
              value={filters.eventType ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, eventType: e.target.value || undefined }))
              }
              options={eventTypeOptions}
            />
            <Input
              label={t("actorUserId")}
              name="actorUserId"
              value={filters.actorUserId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, actorUserId: e.target.value || undefined }))
              }
            />
            <Input
              label={t("entityType")}
              name="entityType"
              value={filters.entityType ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, entityType: e.target.value || undefined }))
              }
            />
            <Input
              label={t("entityId")}
              name="entityId"
              value={filters.entityId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, entityId: e.target.value || undefined }))
              }
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              className="min-h-11"
              onClick={() => {
                setCursorStack([undefined]);
                void fetchPage(undefined);
              }}
            >
              {t("applyFilters")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                const reset = defaultFilters();
                setFilters(reset);
                setCursorStack([undefined]);
                void fetchPage(undefined);
              }}
            >
              {t("reset")}
            </Button>
          </div>
        </StaffFilterPanel>
      }
    >
      {error ? <StaffAlert>{error}</StaffAlert> : null}

      <StaffDataTable
        columns={columns}
        rows={logs}
        rowKey={(log) => log.id}
        page={1}
        pageSize={filters.limit ?? 20}
        total={logs.length}
        onPageChange={() => undefined}
        loading={loading}
        hidePagination
        emptyTitle={t("empty")}
        emptyDescription={loading ? t("loading") : undefined}
      />

      <StaffCursorPagination
        previousLabel={t("previous")}
        nextLabel={t("next")}
        previousDisabled={cursorStack.length <= 1}
        nextDisabled={!hasNext || !nextCursor}
        onPrevious={() => {
          if (cursorStack.length <= 1) return;
          setCursorStack((stack) => stack.slice(0, -1));
        }}
        onNext={() => {
          if (!nextCursor) return;
          setCursorStack((stack) => [...stack, nextCursor]);
        }}
      />

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={t("detailTitle")}
        description={selected?.id}
      >
        {selected ? (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs text-staff-text">
            {JSON.stringify(selected, null, 2)}
          </pre>
        ) : null}
      </Dialog>
    </StaffPageShell>
  );
}
