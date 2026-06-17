"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReportBucket, ReportFilters } from "@/lib/staff/reports-filters";

interface Option {
  value: string;
  label: string;
}

interface DashboardFilterBarProps {
  filters: ReportFilters;
  categories?: Option[];
  orgUnits?: Option[];
  submitting?: boolean;
  onChange: (next: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function DashboardFilterBar({
  filters,
  categories = [],
  orgUnits = [],
  submitting = false,
  onChange,
  onApply,
  onReset,
}: DashboardFilterBarProps) {
  const t = useTranslations("reports.filters");

  const bucketOptions: Array<{ value: ReportBucket; label: string }> = [
    { value: "day", label: t("day") },
    { value: "week", label: t("week") },
    { value: "month", label: t("month") },
  ];

  return (
    <div className="rounded-xl border border-staff-border bg-staff-surface p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Input
          label={t("from")}
          type="date"
          name="from"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
        />
        <Input
          label={t("to")}
          type="date"
          name="to"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
        />
        <Select
          label={t("bucket")}
          name="bucket"
          value={filters.bucket ?? "day"}
          onChange={(e) =>
            onChange({
              ...filters,
              bucket: e.target.value as ReportBucket,
            })
          }
          options={bucketOptions}
        />
        <Select
          label={t("category")}
          name="categoryId"
          value={filters.categoryId ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              categoryId: e.target.value || undefined,
            })
          }
          options={[
            { value: "", label: t("allCategories") },
            ...categories,
          ]}
        />
        <Select
          label={t("orgUnit")}
          name="orgUnitId"
          value={filters.orgUnitId ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              orgUnitId: e.target.value || undefined,
            })
          }
          options={[
            { value: "", label: t("allOrgUnits") },
            ...orgUnits,
          ]}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="min-h-11 cursor-pointer"
          disabled={submitting}
          onClick={onApply}
        >
          {t("apply")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 cursor-pointer"
          disabled={submitting}
          onClick={onReset}
        >
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
