"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
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

const CHANNELS = ["WEB", "EMAIL", "PHONE", "IN_PERSON"] as const;

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
  const [searchDraft, setSearchDraft] = useState(filters.q ?? "");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setSearchDraft(filters.q ?? "");
  }, [filters.q]);

  const refreshPresets = () => setPresets(loadSavedFilterPresets());

  const update = (patch: Partial<ComplaintQueueFilters>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  const applySearch = () => {
    const next = searchDraft.trim() || undefined;
    if (next === (filters.q ?? undefined)) {
      return;
    }
    update({ q: next });
  };

  const hasAdvancedFilters = Boolean(
    filters.channel ||
      filters.locale ||
      filters.submittedFrom ||
      filters.submittedTo,
  );

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-staff-border/40 bg-staff-surface/80 p-3 shadow-staff-card backdrop-blur-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-staff-text-muted">
              {t("filterSearch")}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-staff-text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onBlur={applySearch}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applySearch();
                  }
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-staff-border/35 bg-staff-nav-hover/20 py-2.5 pl-9 pr-3 text-sm text-staff-text transition-colors placeholder:text-staff-text-muted focus:border-staff-nav-active/30 focus:bg-staff-surface focus:outline-none focus:ring-1 focus:ring-staff-nav-active/15"
              />
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[14rem]">
            <Select
              label={t("filterStatus")}
              name="status"
              value={filters.status ?? ""}
              onChange={(e) => update({ status: e.target.value || undefined })}
              options={[
                { value: "", label: t("allStatuses") },
                ...STATUSES.map((s) => ({
                  value: s,
                  label: t(`statusLabels.${s}`),
                })),
              ]}
            />
          </div>

          <Button
            type="button"
            variant="staffSecondary"
            className="min-h-10 shrink-0 cursor-pointer gap-1.5 self-end"
            onClick={() => setShowMore((value) => !value)}
            aria-expanded={showMore}
          >
            {t("moreFilters")}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`}
              aria-hidden
            />
          </Button>
        </div>

        {showMore || hasAdvancedFilters ? (
          <div className="grid gap-3 border-t border-staff-border/30 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label={t("filterChannel")}
              name="channel"
              value={filters.channel ?? ""}
              onChange={(e) => update({ channel: e.target.value || undefined })}
              options={[
                { value: "", label: t("allChannels") },
                ...CHANNELS.map((c) => ({
                  value: c,
                  label: t(`channelLabels.${c}`),
                })),
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
        ) : null}
      </div>

      <details className="group rounded-xl border border-staff-border/30 bg-staff-shell/40 px-4 py-3 text-sm">
        <summary className="cursor-pointer list-none font-medium text-staff-text-muted marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            {t("savedFilters")}
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-staff-border/25 pt-3">
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
            className="min-h-10 cursor-pointer"
            onClick={() => {
              if (!presetName.trim()) return;
              const { page, ...rest } = filters;
              void page;
              saveFilterPreset({ name: presetName.trim(), filters: rest });
              setPresetName("");
              refreshPresets();
            }}
          >
            {t("savePreset")}
          </Button>
          <div className="w-full sm:w-48">
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
      </details>
    </div>
  );
}
