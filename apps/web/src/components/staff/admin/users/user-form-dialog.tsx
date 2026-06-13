"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { mapRoleNamesToIds } from "@/lib/staff/role-map";
import type { RoleListItem } from "@/lib/staff/roles-api";
import { listRoles } from "@/lib/staff/roles-api";
import {
  createUser,
  updateUser,
  type UserListItem,
} from "@/lib/staff/users-api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";

export type UserFormMode = "create" | "edit";

interface UserFormDialogProps {
  open: boolean;
  mode: UserFormMode;
  user: UserListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UserFormDialog({
  open,
  mode,
  user,
  onClose,
  onSaved,
}: UserFormDialogProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listRoles()
      .then((items) => {
        if (!cancelled) setRoles(items ?? []);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when dialog opens
    setError(undefined);
    setPassword("");
    if (mode === "edit" && user && roles.length > 0) {
      setEmail(user.email);
      try {
        setSelectedRoleIds(mapRoleNamesToIds(user.roles, roles));
      } catch {
        setSelectedRoleIds([]);
      }
    } else if (mode === "create") {
      setEmail("");
      setSelectedRoleIds([]);
    }
  }, [open, mode, user, roles]);

  const toggleRole = useCallback((roleId: string, checked: boolean) => {
    setSelectedRoleIds((prev) =>
      checked ? [...prev, roleId] : prev.filter((id) => id !== roleId),
    );
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedRoleIds.length === 0) {
        setError(t("rolesRequired"));
        return;
      }
      setLoading(true);
      setError(undefined);
      try {
        if (mode === "create") {
          await createUser({ email, password, roleIds: selectedRoleIds });
        } else if (user) {
          await updateUser(user.id, { email, roleIds: selectedRoleIds });
        }
        onSaved();
        onClose();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      } finally {
        setLoading(false);
      }
    },
    [selectedRoleIds, mode, email, password, user, onSaved, onClose, t, tc],
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
          <Button type="submit" form="user-form" variant="brand" disabled={loading}>
            {loading ? "…" : tc("save")}
          </Button>
        </>
      }
    >
      <form id="user-form" className="flex flex-col gap-4" onSubmit={onSubmit}>
        {error ? <AdminErrorAlert>{error}</AdminErrorAlert> : null}
        <Input
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode === "create" ? (
          <Input
            label={t("password")}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t("passwordHint")}
          />
        ) : null}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-on-surface">
            {t("roles")}
          </legend>
          {roles.map((role) => (
            <Checkbox
              key={role.id}
              name={`role-${role.id}`}
              label={role.name}
              checked={selectedRoleIds.includes(role.id)}
              onChange={(e) => toggleRole(role.id, e.target.checked)}
            />
          ))}
        </fieldset>
      </form>
    </Dialog>
  );
}
