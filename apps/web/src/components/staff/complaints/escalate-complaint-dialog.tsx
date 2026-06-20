"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { escalateComplaint } from "@/lib/staff/sla-api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EscalateComplaintDialogProps {
  open: boolean;
  complaintId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EscalateComplaintDialog({
  open,
  complaintId,
  onClose,
  onSuccess,
}: EscalateComplaintDialogProps) {
  const t = useTranslations("complaints.actions");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reasonError, setReasonError] = useState<string | undefined>();

  const trimmedReason = reason.trim();
  const reasonValid = trimmedReason.length >= 3;

  useEffect(() => {
    if (!open) return;
    setReason("");
    setError(undefined);
    setReasonError(undefined);
  }, [open]);

  const handleSubmit = async () => {
    if (!reasonValid) {
      setReasonError(t("escalateReasonTooShort"));
      return;
    }
    setSubmitting(true);
    setError(undefined);
    setReasonError(undefined);
    try {
      await escalateComplaint(complaintId, { reason: trimmedReason });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("escalateReasonTooShort"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      tone="staff"
      title={t("escalateTitle")}
      description={t("escalateDescription")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="staffSecondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="brand" onClick={() => void handleSubmit()} disabled={submitting}>
            {t("escalateSubmit")}
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
          label={t("escalateReason")}
          name="escalateReason"
          value={reason}
          hint={`${t("escalateReasonHint")} (${trimmedReason.length}/3)`}
          error={reasonError}
          required
          minLength={3}
          maxLength={500}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError && e.target.value.trim().length >= 3) {
              setReasonError(undefined);
            }
          }}
          rows={4}
        />
      </div>
    </Dialog>
  );
}
