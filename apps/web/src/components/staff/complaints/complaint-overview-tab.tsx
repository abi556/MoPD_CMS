"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  updateComplaint,
  type ComplaintDetail,
  type ComplaintPriority,
} from "@/lib/staff/complaints-api";
import { listCategories } from "@/lib/staff/categories-api";
import { listOrgUnits } from "@/lib/staff/org-units-api";
import { hasPermission } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface ComplaintOverviewTabProps {
  complaint: ComplaintDetail;
  permissions: string[];
  assigneeLabel: string;
  onUpdated: (detail: ComplaintDetail) => void;
}

export function ComplaintOverviewTab({
  complaint,
  permissions,
  assigneeLabel,
  onUpdated,
}: ComplaintOverviewTabProps) {
  const t = useTranslations("complaints.overview");
  const canEdit = hasPermission(permissions, "complaint:update");

  const [categoryId, setCategoryId] = useState(complaint.categoryId ?? "");
  const [orgUnitId, setOrgUnitId] = useState(complaint.orgUnitId ?? "");
  const [priority, setPriority] = useState<ComplaintPriority>(
    complaint.priority ?? "NORMAL",
  );
  const [categories, setCategories] = useState<Array<{ id: string; nameEn: string }>>([]);
  const [orgUnits, setOrgUnits] = useState<Array<{ id: string; nameEn: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setCategoryId(complaint.categoryId ?? "");
    setOrgUnitId(complaint.orgUnitId ?? "");
    setPriority(complaint.priority ?? "NORMAL");
  }, [complaint]);

  useEffect(() => {
    if (!canEdit) return;
    void Promise.all([listCategories(true), listOrgUnits(true)]).then(
      ([cats, units]) => {
        setCategories(cats.map((c) => ({ id: c.id, nameEn: c.nameEn })));
        setOrgUnits(units.map((u) => ({ id: u.id, nameEn: u.nameEn })));
      },
    );
  }, [canEdit]);

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const updated = await updateComplaint(complaint.id, {
        categoryId: categoryId || undefined,
        orgUnitId: orgUnitId || undefined,
        priority,
      });
      onUpdated(updated);
      setMessage(t("saved"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-staff-border bg-staff-surface p-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label={t("reference")} value={complaint.referenceNo} />
        <Field
          label={t("status")}
          value={<StatusBadge status={complaint.status} />}
        />
        <Field label={t("channel")} value={complaint.channel} />
        <Field label={t("locale")} value={complaint.locale.toUpperCase()} />
        <Field
          label={t("submittedAt")}
          value={new Date(complaint.submittedAt).toLocaleString()}
        />
        <Field label={t("assignee")} value={assigneeLabel} />
        <Field label={t("complainant")} value={complaint.complainantName ?? "—"} />
        <Field label={t("email")} value={complaint.complainantEmail ?? "—"} />
        <Field label={t("phone")} value={complaint.complainantPhone ?? "—"} />
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-staff-text">{t("subject")}</h3>
        <p className="mt-1 text-sm text-staff-text-muted">{complaint.subject}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-staff-text">{t("description")}</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-staff-text-muted">
          {complaint.description}
        </p>
      </div>

      {canEdit ? (
        <div className="grid gap-4 border-t border-staff-border pt-4 sm:grid-cols-3">
          <Select
            label={t("category")}
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: "", label: "—" },
              ...categories.map((c) => ({ value: c.id, label: c.nameEn })),
            ]}
          />
          <Select
            label={t("orgUnit")}
            name="orgUnitId"
            value={orgUnitId}
            onChange={(e) => setOrgUnitId(e.target.value)}
            options={[
              { value: "", label: "—" },
              ...orgUnits.map((u) => ({ value: u.id, label: u.nameEn })),
            ]}
          />
          <Select
            label={t("priority")}
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
            options={(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((p) => ({
              value: p,
              label: p,
            }))}
          />
          <div className="sm:col-span-3 flex items-center gap-3">
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="min-h-11 cursor-pointer"
            >
              {t("save")}
            </Button>
            {message ? (
              <span className="text-sm text-green-700">{message}</span>
            ) : null}
            {error ? (
              <span className="text-sm text-red-600" role="alert">
                {error}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-staff-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-staff-text">{value}</dd>
    </div>
  );
}
