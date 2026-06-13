"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { deleteRole, listRoles, type RoleListItem } from "@/lib/staff/roles-api";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { RoleFormDialog } from "@/components/staff/admin/roles/role-form-dialog";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RolesAdminPanel() {
  const t = useTranslations("admin.roles");
  const tc = useTranslations("admin.common");

  const [rows, setRows] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<RoleListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      const items = await listRoles();
      setRows(items ?? []);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load roles on mount
    void fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load roles on mount
  }, []);

  const openCreate = () => {
    setFormMode("create");
    setEditingRole(null);
    setFormOpen(true);
  };

  const openEdit = (role: RoleListItem) => {
    setFormMode("edit");
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      void fetchRoles();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? t("deleteInUse")
          : err instanceof ApiError
            ? err.message
            : tc("errorGeneric");
      setListError(message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <DashboardPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button type="button" variant="brand" onClick={openCreate}>
            {t("create")}
          </Button>
        }
      />

      {listError ? (
        <div className="mb-4">
          <AdminErrorAlert>{listError}</AdminErrorAlert>
        </div>
      ) : null}

      <DataTable
        columns={[
          {
            id: "name",
            header: t("name"),
            cell: (row) => (
              <div>
                <p className="font-medium text-on-surface">{row.name}</p>
                <p className="text-xs text-text-secondary">{row.id}</p>
              </div>
            ),
          },
          {
            id: "permissions",
            header: t("permissions"),
            cell: (row) =>
              t("permissionCount", { count: row.permissionCodes.length }),
          },
          {
            id: "actions",
            header: tc("actions"),
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(row)}
                >
                  {tc("edit")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteTarget(row)}
                >
                  {tc("delete")}
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        page={1}
        pageSize={Math.max(rows.length, 1)}
        total={rows.length}
        onPageChange={() => {}}
        loading={loading}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />

      <RoleFormDialog
        open={formOpen}
        mode={formMode}
        role={editingRole}
        onClose={() => setFormOpen(false)}
        onSaved={() => void fetchRoles()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title={t("confirmDeleteTitle")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("delete")}
        cancelLabel={tc("cancel")}
        destructive
        loading={deleting}
      />
    </div>
  );
}
