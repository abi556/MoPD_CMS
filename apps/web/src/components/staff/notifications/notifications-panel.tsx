"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  listNotifications,
  resendNotification,
  type NotificationDeliveryItem,
  type NotificationDeliveryStatus,
} from "@/lib/staff/notifications-api";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";
import { StaffAlert } from "@/components/staff/ui/staff-alert";
import { StaffFilterPanel } from "@/components/staff/ui/staff-filter-panel";
import { StaffDataTable } from "@/components/staff/ui/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PAGE_SIZE = 20;

export function NotificationsPanel() {
  const t = useTranslations("notifications");
  const tc = useTranslations("admin.common");

  const [rows, setRows] = useState<NotificationDeliveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();

  const [statusFilter, setStatusFilter] = useState<NotificationDeliveryStatus | "">("");
  const [toFilter, setToFilter] = useState("");
  const [templateKeyFilter, setTemplateKeyFilter] = useState("");
  const [debouncedTo, setDebouncedTo] = useState("");
  const [debouncedKey, setDebouncedKey] = useState("");

  const [resendTarget, setResendTarget] = useState<NotificationDeliveryItem | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedTo(toFilter.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [toFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKey(templateKeyFilter.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [templateKeyFilter]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      const res = await listNotifications({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        to: debouncedTo || undefined,
        templateKey: debouncedKey || undefined,
      });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedTo, debouncedKey, tc]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const handleResend = async () => {
    if (!resendTarget) return;
    setResending(true);
    setListError(undefined);
    try {
      await resendNotification(resendTarget.id);
      setResendTarget(null);
      await fetchRows();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? t("resendQueuedConflict")
          : err instanceof ApiError
            ? err.message
            : tc("errorGeneric");
      setListError(message);
      setResendTarget(null);
    } finally {
      setResending(false);
    }
  };

  return (
    <StaffPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      filterBar={
        <StaffFilterPanel>
          <div className="flex flex-wrap gap-3">
            <div className="w-40">
              <Select
                label={t("filterStatus")}
                name="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as NotificationDeliveryStatus | "");
                  setPage(1);
                }}
                options={[
                  { value: "", label: tc("all") },
                  { value: "queued", label: t("statusValues.queued") },
                  { value: "sent", label: t("statusValues.sent") },
                  { value: "failed", label: t("statusValues.failed") },
                  { value: "dead_letter", label: t("statusValues.dead_letter") },
                ]}
              />
            </div>
            <div className="min-w-[10rem] flex-1">
              <Input
                label={t("filterTo")}
                name="to"
                value={toFilter}
                onChange={(e) => {
                  setToFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="min-w-[10rem] flex-1">
              <Input
                label={t("filterTemplateKey")}
                name="templateKey"
                value={templateKeyFilter}
                onChange={(e) => {
                  setTemplateKeyFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </StaffFilterPanel>
      }
    >
      {listError ? <StaffAlert>{listError}</StaffAlert> : null}

      <StaffDataTable
        columns={[
          { id: "templateKey", header: t("templateKey"), cell: (row) => row.templateKey },
          { id: "to", header: t("to"), cell: (row) => row.to },
          {
            id: "status",
            header: t("status"),
            cell: (row) =>
              t(`statusValues.${row.status}` as "statusValues.queued"),
          },
          {
            id: "sentAt",
            header: t("sentAt"),
            cell: (row) => (row.sentAt ? new Date(row.sentAt).toLocaleString() : "—"),
          },
          {
            id: "error",
            header: t("lastError"),
            cell: (row) => row.lastError ?? "—",
          },
          {
            id: "actions",
            header: tc("actions"),
            cell: (row) => (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11"
                disabled={row.status === "queued"}
                onClick={() => setResendTarget(row)}
              >
                {t("resend")}
              </Button>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        loading={loading}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />

      <ConfirmDialog
        open={Boolean(resendTarget)}
        onClose={() => setResendTarget(null)}
        onConfirm={() => void handleResend()}
        title={t("confirmResendTitle")}
        description={t("confirmResendDescription")}
        confirmLabel={t("resend")}
        cancelLabel={tc("cancel")}
        loading={resending}
      />
    </StaffPageShell>
  );
}
