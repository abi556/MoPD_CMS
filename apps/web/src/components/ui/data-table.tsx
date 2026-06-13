"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
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
}

export function getTotalPages(total: number, pageSize: number): number {
  if (total === 0 || pageSize <= 0) {
    return 0;
  }
  return Math.ceil(total / pageSize);
}

export function DataTable<T>({
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
}: DataTableProps<T>) {
  const totalPages = getTotalPages(total, pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="border border-border-standard bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-standard bg-surface-container-low">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-4 py-3 font-semibold text-on-surface ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-border-standard">
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
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="border-b border-border-standard hover:bg-surface-container-low/60"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={`px-4 py-3 text-on-surface ${col.className ?? ""}`}
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-standard px-4 py-3 text-sm text-text-secondary">
        <span>
          {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
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
            disabled={page >= totalPages || loading || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
