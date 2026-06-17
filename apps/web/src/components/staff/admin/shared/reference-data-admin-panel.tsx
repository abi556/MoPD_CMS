"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  buildReferenceTree,
  type ReferenceDataItem,
} from "@/lib/staff/reference-data-tree";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import {
  AdminErrorAlert,
  AdminStatusBadge,
} from "@/components/staff/admin/shared/admin-status-badge";
import {
  ReferenceDataFormDialog,
  type ReferenceDataFormMode,
  type ReferenceDataFormValues,
} from "@/components/staff/admin/shared/reference-data-form-dialog";
import { StaffDataTable } from "@/components/staff/ui/staff-data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const DEPTH_PADDING = ["pl-0", "pl-5", "pl-10", "pl-[3.75rem]", "pl-20"] as const;

type ActiveFilter = "all" | "active" | "inactive";

interface ReferenceDataApi<T extends ReferenceDataItem> {
  list: (activeOnly?: boolean) => Promise<T[]>;
  create: (payload: {
    code: string;
    nameEn: string;
    nameAm?: string;
    parentId?: string;
    sortOrder?: number;
  }) => Promise<T>;
  update: (
    id: string,
    payload: {
      code?: string;
      nameEn?: string;
      nameAm?: string;
      parentId?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) => Promise<T>;
}

interface ReferenceDataAdminPanelProps<T extends ReferenceDataItem> {
  translationNamespace: "admin.categories" | "admin.orgUnits";
  api: ReferenceDataApi<T>;
}

export function ReferenceDataAdminPanel<T extends ReferenceDataItem>({
  translationNamespace,
  api,
}: ReferenceDataAdminPanelProps<T>) {
  const t = useTranslations(translationNamespace);
  const tc = useTranslations("admin.common");

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ReferenceDataFormMode>("create");
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<T | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      let data: T[];
      if (activeFilter === "inactive") {
        data = (await api.list()).filter((item) => !item.isActive);
      } else {
        const activeOnly = activeFilter === "active" ? true : undefined;
        data = await api.list(activeOnly);
      }
      setItems(data);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, api, tc]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const treeRows = useMemo(() => buildReferenceTree(items), [items]);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return treeRows.slice(start, start + pageSize);
  }, [treeRows, page]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, items.length]);

  const openCreate = () => {
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: T) => {
    setFormMode("edit");
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: ReferenceDataFormValues) => {
    if (formMode === "create") {
      await api.create({
        code: values.code,
        nameEn: values.nameEn,
        nameAm: values.nameAm || undefined,
        parentId: values.parentId || undefined,
        sortOrder: values.sortOrder,
      });
    } else if (editingItem) {
      await api.update(editingItem.id, {
        code: values.code,
        nameEn: values.nameEn,
        nameAm: values.nameAm || undefined,
        parentId: values.parentId || null,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      });
    }
    await fetchItems();
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await api.update(deactivateTarget.id, { isActive: false });
      setDeactivateTarget(null);
      await fetchItems();
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

      <div className="mb-4 w-48">
        <Select
          label={tc("search")}
          name="active-filter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          options={[
            { value: "all", label: tc("all") },
            { value: "active", label: tc("activeOnly") },
            { value: "inactive", label: tc("inactiveOnly") },
          ]}
        />
      </div>

      {listError ? (
        <div className="mb-4">
          <AdminErrorAlert>{listError}</AdminErrorAlert>
        </div>
      ) : null}

        <StaffDataTable
        columns={[
          {
            id: "name",
            header: t("nameEn"),
            cell: (row) => (
              <span
                className={
                  DEPTH_PADDING[Math.min(row.depth, DEPTH_PADDING.length - 1)] ?? "pl-20"
                }
              >
                <span className="font-medium text-staff-text">{row.item.nameEn}</span>
                {row.item.nameAm ? (
                  <span className="ml-2 text-staff-text-muted">/ {row.item.nameAm}</span>
                ) : null}
              </span>
            ),
          },
          {
            id: "code",
            header: t("code"),
            cell: (row) => (
              <code className="text-xs text-staff-text-muted">{row.item.code}</code>
            ),
          },
          {
            id: "status",
            header: t("status.active"),
            cell: (row) => (
              <AdminStatusBadge
                active={row.item.isActive}
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
                  onClick={() => openEdit(row.item)}
                >
                  {tc("edit")}
                </Button>
                {row.item.isActive ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setDeactivateTarget(row.item)}
                  >
                    {t("deactivate")}
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={pagedRows}
        rowKey={(row) => row.item.id}
        page={page}
        pageSize={pageSize}
        total={treeRows.length}
        onPageChange={setPage}
        loading={loading}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />

      <ReferenceDataFormDialog
        open={formOpen}
        mode={formMode}
        item={editingItem}
        parents={items}
        translationNamespace={translationNamespace}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
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
