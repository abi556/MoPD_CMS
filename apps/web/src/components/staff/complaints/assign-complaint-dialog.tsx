"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { assignComplaint } from "@/lib/staff/complaints-api";
import { listUsers } from "@/lib/staff/users-api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/permissions";

interface AssignComplaintDialogProps {
  open: boolean;
  complaintId: string;
  sessionUserId: string;
  permissions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignComplaintDialog({
  open,
  complaintId,
  sessionUserId,
  permissions,
  onClose,
  onSuccess,
}: AssignComplaintDialogProps) {
  const t = useTranslations("complaints.actions");
  const [assigneeUserId, setAssigneeUserId] = useState(sessionUserId);
  const [reason, setReason] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canPickUser = hasPermission(permissions, "user:manage");

  useEffect(() => {
    if (!open) return;
    setAssigneeUserId(sessionUserId);
    setReason("");
    setError(undefined);
    if (canPickUser) {
      void listUsers({ page: 1, pageSize: 100, isActive: true }).then((res) => {
        setUsers(res.data.map((u) => ({ id: u.id, email: u.email })));
      });
    }
  }, [open, sessionUserId, canPickUser]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await assignComplaint(complaintId, {
        assigneeUserId,
        reason: reason.trim() || undefined,
      });
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
      title={t("assignTitle")}
      description={t("assignDescription")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {t("assignSubmit")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {canPickUser ? (
          <Select
            label={t("assignee")}
            name="assigneeUserId"
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(e.target.value)}
            options={users.map((u) => ({ value: u.id, label: u.email }))}
          />
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full cursor-pointer"
            onClick={() => setAssigneeUserId(sessionUserId)}
          >
            {t("assignToMe")}
          </Button>
        )}
        <Input
          label={t("reason")}
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Dialog>
  );
}
