"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  deactivateUser,
  listUsers,
  type UserListItem,
} from "@/lib/staff/users-api";
import { useSession } from "@/components/providers/auth-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { UserFormDialog } from "@/components/staff/admin/users/user-form-dialog";
import {
  AdminErrorAlert,
  AdminStatusBadge,
} from "@/components/staff/admin/shared/admin-status-badge";
import { StaffDataTable } from "@/components/staff/ui/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PAGE_SIZE = 20;

type ActiveFilter = "all" | "active" | "inactive";

export function UsersAdminPanel() {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");
  const { user: sessionUser } = useSession();

  const [rows, setRows] = useState<UserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();

  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<UserListItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedEmail(emailFilter.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [emailFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      const isActive =
        activeFilter === "all"
          ? undefined
          : activeFilter === "active";
      const res = await listUsers({
        page,
        pageSize: PAGE_SIZE,
        email: debouncedEmail || undefined,
        isActive,
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
  }, [page, debouncedEmail, activeFilter, tc]);

  useEffect(() => {
     
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch when filters or page change
  }, [page, debouncedEmail, activeFilter]);

  const onEmailFilterChange = (value: string) => {
    setEmailFilter(value);
    setPage(1);
  };

  const onActiveFilterChange = (value: ActiveFilter) => {
    setActiveFilter(value);
    setPage(1);
  };

  const openCreate = () => {
    setFormMode("create");
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: UserListItem) => {
    setFormMode("edit");
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateUser(deactivateTarget.id);
      setDeactivateTarget(null);
      void fetchUsers();
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
    } finally {
      setDeactivating(false);
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

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            label={t("filterEmail")}
            name="email-filter"
            type="search"
            value={emailFilter}
            onChange={(e) => onEmailFilterChange(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label={tc("search")}
            name="active-filter"
            value={activeFilter}
            onChange={(e) => onActiveFilterChange(e.target.value as ActiveFilter)}
            options={[
              { value: "all", label: tc("all") },
              { value: "active", label: tc("activeOnly") },
              { value: "inactive", label: tc("inactiveOnly") },
            ]}
          />
        </div>
      </div>

      {listError ? (
        <div className="mb-4">
          <AdminErrorAlert>{listError}</AdminErrorAlert>
        </div>
      ) : null}

        <StaffDataTable
        columns={[
          {
            id: "email",
            header: t("email"),
            cell: (row) => row.email,
          },
          {
            id: "roles",
            header: t("roles"),
            cell: (row) => row.roles.join(", "),
          },
          {
            id: "status",
            header: t("status.active"),
            cell: (row) => (
              <AdminStatusBadge
                active={row.isActive}
                activeLabel={t("status.active")}
                inactiveLabel={t("status.inactive")}
              />
            ),
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
                {row.isActive ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={row.id === sessionUser?.id}
                    title={row.id === sessionUser?.id ? t("deactivateSelf") : undefined}
                    onClick={() => setDeactivateTarget(row)}
                  >
                    {t("deactivate")}
                  </Button>
                ) : null}
              </div>
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

      <UserFormDialog
        open={formOpen}
        mode={formMode}
        user={editingUser}
        onClose={() => setFormOpen(false)}
        onSaved={() => void fetchUsers()}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void handleDeactivate()}
        title={t("confirmDeactivateTitle")}
        description={t("confirmDeactivateDescription")}
        confirmLabel={t("deactivate")}
        cancelLabel={tc("cancel")}
        destructive
        loading={deactivating}
      />
    </div>
  );
}
