"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { appealComplaint } from "@/lib/staff/complaints-api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AppealComplaintDialogProps {
  open: boolean;
  complaintId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AppealComplaintDialog({
  open,
  complaintId,
  onClose,
  onSuccess,
}: AppealComplaintDialogProps) {
  const t = useTranslations("complaints.actions");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reasonError, setReasonError] = useState<string | undefined>();

  const trimmedReason = reason.trim();
  const reasonValid = trimmedReason.length >= 10;

  useEffect(() => {
    if (!open) return;
    setReason("");
    setError(undefined);
    setReasonError(undefined);
  }, [open]);

  const handleSubmit = async () => {
    if (!reasonValid) {
      setReasonError(t("appealReasonTooShort"));
      return;
    }
    setSubmitting(true);
    setError(undefined);
    setReasonError(undefined);
    try {
      await appealComplaint(complaintId, { reason: trimmedReason });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === "workflow_forbidden"
            ? t("workflowForbidden")
            : err.message,
        );
      } else {
        setError(t("appealReasonTooShort"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      tone="staff"
      title={t("appealTitle")}
      description={t("appealDescription")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="staffSecondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="brand" onClick={() => void handleSubmit()} disabled={submitting}>
            {t("appealSubmit")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <Textarea
          label={t("appealReason")}
          name="appealReason"
          value={reason}
          hint={`${t("appealReasonHint")} (${trimmedReason.length}/10)`}
          error={reasonError}
          required
          minLength={10}
          maxLength={2000}
          placeholder={t("appealReasonPlaceholder")}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError && e.target.value.trim().length >= 10) {
              setReasonError(undefined);
            }
          }}
          rows={4}
        />
      </div>
    </Dialog>
  );
}
