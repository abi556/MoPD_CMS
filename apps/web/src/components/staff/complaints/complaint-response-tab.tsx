"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  updateComplaint,
  type ComplaintDetail,
} from "@/lib/staff/complaints-api";
import {
  canEditResponseDraft,
  canViewResponseDraft,
} from "@/lib/staff/complaint-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StaffEmptyState } from "@/components/staff/ui/staff-empty-state";

const MIN_DRAFT_LENGTH = 20;
const MAX_DRAFT_LENGTH = 50000;

interface ComplaintResponseTabProps {
  complaint: ComplaintDetail;
  permissions: string[];
  onUpdated: (detail: ComplaintDetail) => void;
}

export function ComplaintResponseTab({
  complaint,
  permissions,
  onUpdated,
}: ComplaintResponseTabProps) {
  const t = useTranslations("complaints.response");
  const editable = canEditResponseDraft(complaint.status, permissions);
  const visible = canViewResponseDraft(complaint.status);

  const [draft, setDraft] = useState(complaint.responseDraft ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setDraft(complaint.responseDraft ?? "");
  }, [complaint.responseDraft]);

  if (!visible) {
    return (
      <StaffEmptyState
        title={t("unavailableTitle")}
        description={t("unavailableDescription")}
      />
    );
  }

  const trimmedLength = draft.trim().length;
  const meetsMinimum = trimmedLength >= MIN_DRAFT_LENGTH;

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const updated = await updateComplaint(complaint.id, {
        responseDraft: draft.trim() || null,
      });
      onUpdated(updated);
      setMessage(t("saved"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-staff-border/40 bg-staff-surface p-6 shadow-staff-card">
      <div>
        <h3 className="text-sm font-semibold text-staff-text">{t("title")}</h3>
        <p className="mt-1 text-sm text-staff-text-muted">{t("description")}</p>
      </div>

      {editable ? (
        <>
          <Textarea
            label={t("body")}
            name="responseDraft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            maxLength={MAX_DRAFT_LENGTH}
            placeholder={t("placeholder")}
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-staff-text-muted">
            <span>
              {t("charCount", {
                count: trimmedLength,
                min: MIN_DRAFT_LENGTH,
              })}
            </span>
            {!meetsMinimum ? (
              <span className="text-amber-700">{t("minLengthHint")}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="min-h-11 cursor-pointer"
            >
              {t("save")}
            </Button>
            {message ? (
              <span className="text-sm text-staff-nav-active">{message}</span>
            ) : null}
            {error ? (
              <span className="text-sm text-red-400" role="alert">
                {error}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-staff-border bg-staff-bg p-4">
          {complaint.responseDraft?.trim() ? (
            <p className="whitespace-pre-wrap text-sm text-staff-text">
              {complaint.responseDraft}
            </p>
          ) : (
            <p className="text-sm text-staff-text-muted">{t("emptyReadOnly")}</p>
          )}
        </div>
      )}
    </div>
  );
}
