"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
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
}: StaffDataTableProps<T>) {
  const totalPages = getTotalPages(total, pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-xl border border-staff-border bg-staff-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-staff-border bg-staff-shell/60">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-4 py-3 font-semibold text-staff-text ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-staff-border">
                    {columns.map((col) => (
                      <td key={col.id} className="px-4 py-3">
                        <LoadingSkeleton className="h-4 w-full max-w-[12rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  <StaffEmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="border-b border-staff-border transition-colors hover:bg-staff-nav-hover/40"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={`px-4 py-3 text-staff-text ${col.className ?? ""}`}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
      {!hidePagination ? (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-staff-border px-4 py-3 text-sm text-staff-text-muted">
        <span>{total === 0 ? "0 results" : `${from}–${to} of ${total}`}</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-11"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden />
          </Button>
          <span className="min-w-[5rem] text-center tabular-nums">
            Page {totalPages === 0 ? 0 : page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-11"
            disabled={page >= totalPages || loading || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} aria-hidden />
          </Button>
        </div>
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
      <Button
        type="button"
        variant="secondary"
        className="min-h-11"
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        {previousLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="min-h-11"
        disabled={nextDisabled}
        onClick={onNext}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
