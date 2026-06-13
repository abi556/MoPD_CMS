"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ComplaintQueueFilters } from "@/lib/staff/complaint-filters";
import {
  loadSavedFilterPresets,
  saveFilterPreset,
  type SavedFilterPreset,
} from "@/lib/staff/complaint-filters";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ComplaintStatus } from "@/components/ui/status-badge";

const STATUSES: ComplaintStatus[] = [
  "SUBMITTED",
  "TRIAGE",
  "ASSIGNED",
  "IN_INVESTIGATION",
  "DRAFT_RESPONSE",
  "QA_LEGAL_REVIEW",
  "RESPONSE_ISSUED",
  "AWAITING_FEEDBACK",
  "APPEAL",
  "CLOSED",
];

interface ComplaintQueueFiltersProps {
  filters: ComplaintQueueFilters;
  onChange: (filters: ComplaintQueueFilters) => void;
}

export function ComplaintQueueFiltersBar({
  filters,
  onChange,
}: ComplaintQueueFiltersProps) {
  const t = useTranslations("complaints.queue");
  const [presets, setPresets] = useState<SavedFilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");

  const refreshPresets = () => setPresets(loadSavedFilterPresets());

  const update = (patch: Partial<ComplaintQueueFilters>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-staff-border bg-staff-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          label={t("filterStatus")}
          name="status"
          value={filters.status ?? ""}
          onChange={(e) => update({ status: e.target.value || undefined })}
          options={[
            { value: "", label: t("allStatuses") },
            ...STATUSES.map((s) => ({
              value: s,
              label: s.replace(/_/g, " "),
            })),
          ]}
        />
        <Select
          label={t("filterChannel")}
          name="channel"
          value={filters.channel ?? ""}
          onChange={(e) => update({ channel: e.target.value || undefined })}
          options={[
            { value: "", label: t("allChannels") },
            { value: "WEB", label: "WEB" },
            { value: "EMAIL", label: "EMAIL" },
            { value: "PHONE", label: "PHONE" },
            { value: "IN_PERSON", label: "IN_PERSON" },
          ]}
        />
        <Select
          label={t("filterLocale")}
          name="locale"
          value={filters.locale ?? ""}
          onChange={(e) => update({ locale: e.target.value || undefined })}
          options={[
            { value: "", label: t("allLocales") },
            { value: "en", label: "EN" },
            { value: "am", label: "AM" },
          ]}
        />
        <Input
          label={t("filterFrom")}
          name="submittedFrom"
          type="date"
          value={filters.submittedFrom?.slice(0, 10) ?? ""}
          onChange={(e) =>
            update({
              submittedFrom: e.target.value
                ? `${e.target.value}T00:00:00.000Z`
                : undefined,
            })
          }
        />
        <Input
          label={t("filterTo")}
          name="submittedTo"
          type="date"
          value={filters.submittedTo?.slice(0, 10) ?? ""}
          onChange={(e) =>
            update({
              submittedTo: e.target.value
                ? `${e.target.value}T23:59:59.999Z`
                : undefined,
            })
          }
        />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <Input
            label={t("presetName")}
            name="presetName"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 cursor-pointer"
          onClick={() => {
            if (!presetName.trim()) return;
            const { page: _p, ...rest } = filters;
            saveFilterPreset({ name: presetName.trim(), filters: rest });
            setPresetName("");
            refreshPresets();
          }}
        >
          {t("savePreset")}
        </Button>
        <div className="w-48">
          <Select
            label={t("loadPreset")}
            name="loadPreset"
            value=""
            onFocus={refreshPresets}
            onChange={(e) => {
              const name = e.target.value;
              if (!name) return;
              const preset = loadSavedFilterPresets().find((p) => p.name === name);
              if (preset) {
                onChange({ ...filters, ...preset.filters, page: 1 });
              }
            }}
            options={[
              { value: "", label: t("loadPreset") },
              ...presets.map((p) => ({ value: p.name, label: p.name })),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
