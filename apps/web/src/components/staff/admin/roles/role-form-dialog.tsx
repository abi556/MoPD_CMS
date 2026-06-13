"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  createRole,
  listPermissions,
  updateRole,
  type PermissionListItem,
  type RoleListItem,
} from "@/lib/staff/roles-api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";
import {
  PermissionMatrix,
  permissionCodesToIds,
} from "@/components/staff/admin/roles/permission-matrix";

export type RoleFormMode = "create" | "edit";

interface RoleFormDialogProps {
  open: boolean;
  mode: RoleFormMode;
  role: RoleListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RoleFormDialog({
  open,
  mode,
  role,
  onClose,
  onSaved,
}: RoleFormDialogProps) {
  const t = useTranslations("admin.roles");
  const tc = useTranslations("admin.common");

  const [roleId, setRoleId] = useState("");
  const [name, setName] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listPermissions()
      .then((items) => {
        if (!cancelled) setPermissions(items ?? []);
      })
      .catch(() => {
        if (!cancelled) setPermissions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when dialog opens
    setError(undefined);
    if (mode === "edit" && role && permissions.length > 0) {
      setRoleId(role.id);
      setName(role.name);
      try {
        setSelectedPermissionIds(
          permissionCodesToIds(role.permissionCodes, permissions),
        );
      } catch {
        setSelectedPermissionIds([]);
      }
    } else if (mode === "create") {
      setRoleId("");
      setName("");
      setSelectedPermissionIds([]);
    }
  }, [open, mode, role, permissions]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedPermissionIds.length === 0) {
        setError(tc("errorGeneric"));
        return;
      }
      setLoading(true);
      setError(undefined);
      try {
        if (mode === "create") {
          await createRole({
            id: roleId.trim(),
            name: name.trim(),
            permissionIds: selectedPermissionIds,
          });
        } else if (role) {
          await updateRole(role.id, {
            name: name.trim(),
            permissionIds: selectedPermissionIds,
          });
        }
        onSaved();
        onClose();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      } finally {
        setLoading(false);
      }
    },
    [selectedPermissionIds, mode, roleId, name, role, onSaved, onClose, tc],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("create") : t("edit")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form="role-form" variant="brand" disabled={loading}>
            {loading ? "…" : tc("save")}
          </Button>
        </>
      }
    >
      <form id="role-form" className="flex flex-col gap-4" onSubmit={onSubmit}>
        {error ? <AdminErrorAlert>{error}</AdminErrorAlert> : null}
        {mode === "create" ? (
          <Input
            label={t("id")}
            name="roleId"
            required
            minLength={3}
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            hint={t("idHint")}
          />
        ) : null}
        <Input
          label={t("name")}
          name="name"
          required
          minLength={3}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <PermissionMatrix
          permissions={permissions}
          selectedIds={selectedPermissionIds}
          onChange={setSelectedPermissionIds}
        />
      </form>
    </Dialog>
  );
}
