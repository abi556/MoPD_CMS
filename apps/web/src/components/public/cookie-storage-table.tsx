"use client";

import type { ReactNode } from "react";

export interface CookiePolicyRow {
  id: string;
  what: string;
  why: string;
  howLong: string;
  essential: string;
}

interface CookiePolicyTableProps {
  caption: string;
  tableKey?: string;
  headers: {
    what: string;
    why: string;
    howLong: string;
    essential: string;
  };
  rows: CookiePolicyRow[];
}

export function CookiePolicyTable({
  caption,
  tableKey = "policy",
  headers,
  rows,
}: CookiePolicyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left text-body-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border-standard bg-surface-container-low">
            <th className="px-3 py-2 font-semibold">{headers.what}</th>
            <th className="px-3 py-2 font-semibold">{headers.why}</th>
            <th className="px-3 py-2 font-semibold">{headers.howLong}</th>
            <th className="px-3 py-2 font-semibold">{headers.essential}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${tableKey}-${row.id}`}
              className="border-b border-border-standard"
            >
              <td className="px-3 py-2 font-medium text-on-surface">
                {row.what}
              </td>
              <td className="px-3 py-2 text-text-secondary">{row.why}</td>
              <td className="px-3 py-2">{row.howLong}</td>
              <td className="px-3 py-2">{row.essential}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** @deprecated Use CookiePolicyTable */
export const CookieStorageTable = CookiePolicyTable;

export function CookiePolicyPreferencesSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-none border border-border-standard bg-surface-container-lowest p-4 md:p-6">
      <h3 className="mb-4 font-h3 text-h3 font-semibold text-on-background">
        {title}
      </h3>
      {children}
    </div>
  );
}
