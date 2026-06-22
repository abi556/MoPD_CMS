"use client";

import type { ReactNode } from "react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { DashboardPager, StaffPagerIconButton } from "@/components/staff/dashboard/dashboard-pager";
import { StaffEmptyState } from "./staff-empty-state";
import { getTotalPages, type DataTableColumn } from "@/components/ui/data-table";

export type { DataTableColumn };

export interface StaffDataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  hidePagination?: boolean;
  /** Highlights the row whose key matches (e.g. article being edited). */
  activeRowKey?: string;
}

export function StaffDataTable<T>({
  columns,
  rows,
  rowKey,
  page,
  pageSize,
  total,
  onPageChange,
  loading = false,
  emptyTitle = "No records",
  emptyDescription = "There is nothing to display yet.",
  hidePagination = false,
  activeRowKey,
}: StaffDataTableProps<T>) {
  const totalPages = getTotalPages(total, pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-xl border border-staff-border/40 bg-staff-surface shadow-staff-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-staff-border/40 bg-staff-shell/50">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-staff-text-muted ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-staff-border/30">
                    {columns.map((col) => (
                      <td key={col.id} className="px-4 py-3.5">
                        <LoadingSkeleton className="h-4 w-full max-w-[12rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <StaffEmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row) => {
                  const key = rowKey(row);
                  const isActive = activeRowKey !== undefined && key === activeRowKey;
                  return (
                  <tr
                    key={key}
                    className={`border-b border-staff-border/25 transition-colors last:border-b-0 hover:bg-staff-nav-hover/35 ${
                      isActive
                        ? "bg-staff-nav-active/10 ring-1 ring-inset ring-staff-nav-active/40"
                        : ""
                    }`}
                    aria-selected={isActive || undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={`px-4 py-3.5 align-middle text-staff-text ${col.className ?? ""}`}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
      {!hidePagination ? (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-staff-border/30 bg-staff-shell/30 px-4 py-3 text-sm text-staff-text-muted">
        <span>{total === 0 ? "0 results" : `${from}–${to} of ${total}`}</span>
        <DashboardPager
          previousLabel="Previous page"
          nextLabel="Next page"
          previousDisabled={page <= 1 || loading}
          nextDisabled={page >= totalPages || loading || totalPages === 0}
          onPrevious={() => onPageChange(page - 1)}
          onNext={() => onPageChange(page + 1)}
          center={
            <span className="tabular-nums">
              {totalPages === 0 ? "0 / 0" : `${page} / ${totalPages}`}
            </span>
          }
        />
      </div>
      ) : null}
    </div>
  );
}

export function StaffCursorPagination({
  previousLabel = "Previous",
  nextLabel = "Next",
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: {
  previousLabel?: string;
  nextLabel?: string;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-staff-border bg-staff-surface px-4 py-3">
      <StaffPagerIconButton
        direction="previous"
        label={previousLabel}
        disabled={previousDisabled}
        onClick={onPrevious}
      />
      <StaffPagerIconButton
        direction="next"
        label={nextLabel}
        disabled={nextDisabled}
        onClick={onNext}
      />
    </div>
  );
}
