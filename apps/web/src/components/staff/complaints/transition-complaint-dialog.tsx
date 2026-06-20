"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { transitionComplaint } from "@/lib/staff/complaints-api";
import { getAllowedTransitions } from "@/lib/staff/workflow-transitions";
import type { ComplaintStatus } from "@/components/ui/status-badge";
import { formatStatusLabel } from "@/components/ui/status-badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TransitionDialogVariant = "default" | "approve" | "return";

interface TransitionComplaintDialogProps {
  open: boolean;
  complaintId: string;
  currentStatus: ComplaintStatus;
  permissions: string[];
  variant?: TransitionDialogVariant;
  onClose: () => void;
  onSuccess: () => void;
}

function variantTargetStatus(
  variant: TransitionDialogVariant,
): ComplaintStatus | undefined {
  if (variant === "approve") return "RESPONSE_ISSUED";
  if (variant === "return") return "DRAFT_RESPONSE";
  return undefined;
}

export function TransitionComplaintDialog({
  open,
  complaintId,
  currentStatus,
  permissions,
  variant = "default",
  onClose,
  onSuccess,
}: TransitionComplaintDialogProps) {
  const t = useTranslations("complaints.actions");
  const options = useMemo(
    () => getAllowedTransitions(currentStatus, permissions),
    [currentStatus, permissions],
  );
  const lockedStatus = variantTargetStatus(variant);
  const [toStatus, setToStatus] = useState<ComplaintStatus>(
    lockedStatus ?? options[0] ?? currentStatus,
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reasonError, setReasonError] = useState<string | undefined>();

  const trimmedReason = reason.trim();
  const reasonValid = trimmedReason.length >= 5;
  const hideStatusSelect = Boolean(lockedStatus);

  const title =
    variant === "approve"
      ? t("approveTitle")
      : variant === "return"
        ? t("returnTitle")
        : t("transitionTitle");
  const description =
    variant === "approve"
      ? t("approveDescription")
      : variant === "return"
        ? t("returnDescription")
        : t("transitionDescription");
  const submitLabel =
    variant === "approve"
      ? t("approveSubmit")
      : variant === "return"
        ? t("returnSubmit")
        : t("transitionSubmit");

  useEffect(() => {
    if (!open) return;
    setToStatus(lockedStatus ?? options[0] ?? currentStatus);
    setReason("");
    setError(undefined);
    setReasonError(undefined);
  }, [open, currentStatus, options, lockedStatus]);

  const handleSubmit = async () => {
    if (!reasonValid) {
      setReasonError(t("reasonTooShort"));
      return;
    }
    setSubmitting(true);
    setError(undefined);
    setReasonError(undefined);
    try {
      await transitionComplaint(complaintId, {
        toStatus,
        reason: trimmedReason,
      });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === "workflow_forbidden"
            ? t("workflowForbidden")
            : err.code === "VALIDATION_ERROR" || err.status === 422
              ? err.message || t("validationError")
              : err.message,
        );
      } else {
        setError(t("validationError"));
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
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="staffSecondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={() => void handleSubmit()}
            disabled={submitting || (!hideStatusSelect && options.length === 0)}
          >
            {submitLabel}
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
        {hideStatusSelect ? null : (
          <Select
            label={t("toStatus")}
            name="toStatus"
            value={toStatus}
            onChange={(e) => setToStatus(e.target.value as ComplaintStatus)}
            options={options.map((status) => ({
              value: status,
              label: formatStatusLabel(status),
            }))}
          />
        )}
        <Textarea
          label={t("transitionReason")}
          name="reason"
          value={reason}
          hint={`${t("transitionReasonHint")} (${trimmedReason.length}/5)`}
          error={reasonError}
          required
          minLength={5}
          maxLength={500}
          placeholder={t("transitionReasonPlaceholder")}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError && e.target.value.trim().length >= 5) {
              setReasonError(undefined);
            }
          }}
          rows={4}
        />
      </div>
    </Dialog>
  );
}
