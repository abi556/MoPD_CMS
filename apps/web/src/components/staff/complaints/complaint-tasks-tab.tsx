"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  createCaseTask,
  listCaseTasks,
  updateCaseTask,
  type CaseTaskItem,
  type CaseTaskStatus,
} from "@/lib/staff/case-tasks-api";
import { listUsers } from "@/lib/staff/users-api";
import { hasPermission } from "@/lib/permissions";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StaffEmptyState } from "@/components/staff/ui/staff-empty-state";

const TASK_STATUSES: CaseTaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

interface ComplaintTasksTabProps {
  complaintId: string;
  permissions: string[];
}

export function ComplaintTasksTab({
  complaintId,
  permissions,
}: ComplaintTasksTabProps) {
  const t = useTranslations("complaints.tasks");
  const { user } = useSession();
  const canRead = hasPermission(permissions, "case:read");
  const canWrite = hasPermission(permissions, "case:write");
  const canPickAssignee = hasPermission(permissions, "user:manage");

  const [tasks, setTasks] = useState<CaseTaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState(user?.id ?? "");
  const [assigneeOptions, setAssigneeOptions] = useState<
    Array<{ id: string; email: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchTasks = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listCaseTasks(complaintId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [canRead, complaintId, t]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!canPickAssignee || !user) return;
    void listUsers({ page: 1, pageSize: 100, isActive: true }).then((res) => {
      setAssigneeOptions(res.data.map((u) => ({ id: u.id, email: u.email })));
    });
  }, [canPickAssignee, user]);

  useEffect(() => {
    if (user && !assigneeUserId) {
      setAssigneeUserId(user.id);
    }
  }, [assigneeUserId, user]);

  const handleCreate = async () => {
    if (!title.trim() || !assigneeUserId) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await createCaseTask(complaintId, {
        title: title.trim(),
        assigneeUserId,
      });
      setTitle("");
      await fetchTasks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task: CaseTaskItem, status: CaseTaskStatus) => {
    setError(undefined);
    try {
      await updateCaseTask(complaintId, task.id, { status });
      await fetchTasks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("updateFailed"));
    }
  };

  if (!canRead) {
    return (
      <StaffEmptyState title={t("emptyTitle")} description={t("noAccessDescription")} />
    );
  }

  return (
    <div className="space-y-6">
      {canWrite ? (
        <div className="rounded-xl border border-staff-border/40 bg-staff-surface p-4 shadow-staff-card">
          <Textarea
            label={t("titleLabel")}
            name="taskTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
          />
          {canPickAssignee ? (
            <div className="mt-3">
              <label htmlFor="task-assignee" className="text-sm font-medium text-staff-text">
                {t("assignee")}
              </label>
              <select
                id="task-assignee"
                value={assigneeUserId}
                onChange={(e) => setAssigneeUserId(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-staff-border bg-staff-input-bg px-4 py-2 text-sm text-staff-text"
              >
                {assigneeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.email}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            className="mt-3 min-h-11 cursor-pointer"
            onClick={() => void handleCreate()}
            disabled={submitting || !title.trim()}
          >
            {t("submit")}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-staff-text-muted">{t("loading")}</p>
      ) : tasks.length === 0 ? (
        <StaffEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="divide-y divide-staff-border rounded-lg border border-staff-border">
          {tasks.map((task) => (
            <li key={task.id} className="space-y-2 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-staff-text">{task.title}</p>
                {canWrite ? (
                  <select
                    aria-label={t("statusLabel")}
                    value={task.status}
                    onChange={(e) =>
                      void handleStatusChange(task, e.target.value as CaseTaskStatus)
                    }
                    className="min-h-11 rounded-lg border border-staff-border bg-staff-input-bg px-3 py-2 text-sm"
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`status.${status}`)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-staff-text-muted">{t(`status.${task.status}`)}</span>
                )}
              </div>
              <p className="text-staff-text-muted">
                {t("assigneeId", { id: task.assigneeUserId.slice(0, 8) })} ·{" "}
                {new Date(task.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
