"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  createReportExport,
  getReportExportDownload,
  getReportExportStatus,
  type ReportExportJob,
} from "@/lib/staff/reports-api";
import type { ReportFilters } from "@/lib/staff/reports-filters";
import { DashboardFilterBar } from "./dashboard-filter-bar";
import { ReportsPageShell } from "./reports-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { StaffDataTable, type DataTableColumn } from "@/components/staff/ui/staff-data-table";

function defaultFilters(): ReportFilters {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    bucket: "day",
  };
}

export function ReportsExportsView({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const t = useTranslations("reports");
  const [filters, setFilters] = useState<ReportFilters>(() => defaultFilters());
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [jobs, setJobs] = useState<ReportExportJob[]>([]);

  const pollIds = useMemo(
    () => jobs.filter((j) => j.status === "PENDING" || j.status === "PROCESSING").map((j) => j.id),
    [jobs],
  );

  useEffect(() => {
    if (pollIds.length === 0) return;
    const timer = setInterval(() => {
      void Promise.all(pollIds.map((id) => getReportExportStatus(id))).then((updated) => {
        setJobs((prev) =>
          prev.map((job) => updated.find((u) => u.id === job.id) ?? job),
        );
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [pollIds]);

  const handleDownload = useCallback(async (id: string) => {
    setError(undefined);
    try {
      const result = await getReportExportDownload(id);
      if (!result.url) {
        setError(t("exportsTable.stillProcessing"));
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setError(t("exportsTable.expired"));
        return;
      }
      setError(err instanceof ApiError ? err.message : t("exportsTable.downloadFailed"));
    }
  }, [t]);

  const columns: DataTableColumn<ReportExportJob>[] = useMemo(
    () => [
      {
        id: "id",
        header: t("exportsTable.jobId"),
        cell: (job) => job.id.slice(0, 8),
      },
      {
        id: "status",
        header: t("exportsTable.status"),
        cell: (job) => <Badge>{job.status}</Badge>,
      },
      {
        id: "created",
        header: t("exportsTable.created"),
        cell: (job) => new Date(job.createdAt).toLocaleString(),
      },
      {
        id: "completed",
        header: t("exportsTable.completed"),
        cell: (job) =>
          job.completedAt ? new Date(job.completedAt).toLocaleString() : "—",
      },
      {
        id: "actions",
        header: t("exportsTable.actions"),
        cell: (job) => (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => void handleDownload(job.id)}
          >
            {t("exportsTable.download")}
          </Button>
        ),
      },
    ],
    [t, handleDownload],
  );

  const handleCreate = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      const created = await createReportExport({
        ...filters,
        format,
        reportType: "complaints",
      });
      setJobs((prev) => [{ ...created, completedAt: null, errorMessage: null }, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("exportsTable.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReportsPageShell
      title={title}
      subtitle={subtitle}
      filterBar={
        <div className="space-y-3">
          <DashboardFilterBar
            filters={filters}
            submitting={submitting}
            onChange={setFilters}
            onApply={() => undefined}
            onReset={() => setFilters(defaultFilters())}
          />
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label={t("exportsTable.status")}
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as "csv" | "xlsx" | "pdf")}
              options={[
                { value: "csv", label: t("exportFormat.csv") },
                { value: "xlsx", label: t("exportFormat.xlsx") },
                { value: "pdf", label: t("exportFormat.pdf") },
              ]}
            />
            <Button
              className="min-h-11"
              disabled={submitting}
              onClick={() => void handleCreate()}
            >
              {t("createExport")}
            </Button>
          </div>
        </div>
      }
    >
      {error ? <StaffAlert>{error}</StaffAlert> : null}
      <StaffDataTable
        columns={columns}
        rows={jobs}
        rowKey={(job) => job.id}
        page={1}
        pageSize={Math.max(jobs.length, 1)}
        total={jobs.length}
        onPageChange={() => undefined}
        hidePagination
        emptyTitle={t("exportsTable.empty")}
      />
    </ReportsPageShell>
  );
}
