"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { assignComplaint } from "@/lib/staff/complaints-api";
import { listUsers } from "@/lib/staff/users-api";
import { canPickAssigneeUser } from "@/lib/staff/workflow-transitions";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  WorkflowBlockedCallout,
  workflowBlockedFromApiError,
  type WorkflowBlockedInfo,
} from "@/components/staff/complaints/workflow-blocked-callout";

interface AssignComplaintDialogProps {
  open: boolean;
  complaintId: string;
  sessionUserId: string;
  sessionRoles: string[];
  permissions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignComplaintDialog({
  open,
  complaintId,
  sessionUserId,
  sessionRoles,
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
  const [blocked, setBlocked] = useState<WorkflowBlockedInfo | undefined>();

  const canPickUser = canPickAssigneeUser(permissions, {
    userId: sessionUserId,
    roles: sessionRoles,
  });

  useEffect(() => {
    if (!open) return;
    setAssigneeUserId(sessionUserId);
    setReason("");
    setError(undefined);
    setBlocked(undefined);
    if (canPickUser) {
      void listUsers({ page: 1, pageSize: 100, isActive: true }).then((res) => {
        setUsers(res.data.map((u) => ({ id: u.id, email: u.email })));
      });
    }
  }, [open, sessionUserId, canPickUser]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(undefined);
    setBlocked(undefined);
    try {
      await assignComplaint(complaintId, {
        assigneeUserId,
        reason: reason.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "workflow_forbidden") {
          setBlocked(
            workflowBlockedFromApiError({
              message: err.message,
              details: err.details,
            }),
          );
        } else {
          setError(err.message);
        }
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
      title={t("assignTitle")}
      description={
        canPickUser ? t("assignDescription") : t("assignSelfDescription")
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="staffSecondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="brand" onClick={() => void handleSubmit()} disabled={submitting}>
            {canPickUser ? t("assignSubmit") : t("assignToMe")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {blocked ? (
          <WorkflowBlockedCallout
            complaintId={complaintId}
            info={blocked}
            showCreateTaskLink={false}
          />
        ) : null}
        {error ? (
          <p className="text-sm text-red-400" role="alert">
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
          <p className="text-sm text-staff-text-muted">{t("assignSelfHint")}</p>
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
