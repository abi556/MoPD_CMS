"use client";

import { useTranslations } from "next-intl";
import type { ComplaintFormOptionItem } from "@/lib/public-complaints";
import { optionLabel } from "@/lib/public-complaints";

interface CategoryOrgSelectsProps {
  locale: "en" | "am";
  orgUnits: ComplaintFormOptionItem[];
  orgUnitId: string;
  onOrgUnitChange: (id: string) => void;
  orgUnitError?: string;
  orgUnitsUnavailable?: boolean;
}

const selectClassName =
  "min-h-11 w-full rounded-md border border-border-standard bg-surface-container-lowest px-3 py-2 text-body text-on-surface shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2";

export function CategoryOrgSelects({
  locale,
  orgUnits,
  orgUnitId,
  onOrgUnitChange,
  orgUnitError,
  orgUnitsUnavailable = false,
}: CategoryOrgSelectsProps) {
  const t = useTranslations("complaintSubmit");

  return (
    <div className="space-y-1">
      <label htmlFor="orgUnitId" className="text-label font-semibold text-on-surface">
        {t("fields.orgUnit")} <span className="text-danger">*</span>
      </label>
      <select
        id="orgUnitId"
        name="orgUnitId"
        required
        disabled={orgUnitsUnavailable || orgUnits.length === 0}
        value={orgUnitId}
        onChange={(e) => onOrgUnitChange(e.target.value)}
        className={selectClassName}
        aria-invalid={Boolean(orgUnitError)}
      >
        <option value="">{t("fields.orgUnitPlaceholder")}</option>
        {orgUnits.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {optionLabel(unit, locale)}
          </option>
        ))}
      </select>
      <p className="text-body-sm text-text-secondary">{t("fields.orgUnitHint")}</p>
      {orgUnitsUnavailable || orgUnits.length === 0 ? (
        <p className="text-xs text-text-secondary" role="status">
          {t("errors.orgUnitsUnavailable")}
        </p>
      ) : null}
      {orgUnitError ? (
        <p className="text-xs text-danger" role="alert">
          {orgUnitError}
        </p>
      ) : null}
    </div>
  );
}
