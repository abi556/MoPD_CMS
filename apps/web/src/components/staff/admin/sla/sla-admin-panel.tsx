"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { listCategories } from "@/lib/staff/categories-api";
import { listSlaConfigs, type SlaConfigItem, type SlaPriority } from "@/lib/staff/sla-api";
import { buildSlaMatrix } from "@/lib/staff/sla-matrix";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import {
  AdminErrorAlert,
  AdminStatusBadge,
} from "@/components/staff/admin/shared/admin-status-badge";
import { SlaFormDialog } from "@/components/staff/admin/sla/sla-form-dialog";
import { StaffDataTable } from "@/components/staff/ui/staff-data-table";
import { Button } from "@/components/ui/button";

type ViewMode = "list" | "matrix";

export function SlaAdminPanel() {
  const t = useTranslations("admin.sla");
  const tc = useTranslations("admin.common");

  const [configs, setConfigs] = useState<SlaConfigItem[]>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof listCategories>>>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [formOpen, setFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlaConfigItem | null>(null);
  const [presetCategoryId, setPresetCategoryId] = useState<string | null>(null);
  const [presetPriority, setPresetPriority] = useState<SlaPriority | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      const [sla, cats] = await Promise.all([listSlaConfigs(), listCategories()]);
      setConfigs(sla);
      setCategories(cats);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const matrix = useMemo(
    () => buildSlaMatrix(configs, categories),
    [configs, categories],
  );

  const openCreate = () => {
    setEditingConfig(null);
    setPresetCategoryId(null);
    setPresetPriority(null);
    setFormOpen(true);
  };

  const openCreateFromCell = (categoryId: string | null, priority: SlaPriority) => {
    setEditingConfig(null);
    setPresetCategoryId(categoryId);
    setPresetPriority(priority);
    setFormOpen(true);
  };

  const openEdit = (config: SlaConfigItem) => {
    setEditingConfig(config);
    setPresetCategoryId(null);
    setPresetPriority(null);
    setFormOpen(true);
  };

  return (
    <div>
      <DashboardPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={viewMode === "list" ? "brand" : "secondary"}
              onClick={() => setViewMode("list")}
            >
              {t("viewList")}
            </Button>
            <Button
              type="button"
              variant={viewMode === "matrix" ? "brand" : "secondary"}
              onClick={() => setViewMode("matrix")}
            >
              {t("viewMatrix")}
            </Button>
            <Button type="button" variant="brand" onClick={openCreate}>
              {t("create")}
            </Button>
          </div>
        }
      />

      {listError ? (
        <div className="mb-4">
          <AdminErrorAlert>{listError}</AdminErrorAlert>
        </div>
      ) : null}

      {viewMode === "list" ? (
        <StaffDataTable
          columns={[
            { id: "name", header: t("name"), cell: (row) => row.name },
            { id: "priority", header: t("priority"), cell: (row) => t(`priorities.${row.priority}`) },
            {
              id: "category",
              header: t("category"),
              cell: (row) =>
                row.categoryId
                  ? categories.find((c) => c.id === row.categoryId)?.nameEn ?? row.categoryId
                  : t("allCategories"),
            },
            { id: "hours", header: t("targetHours"), cell: (row) => row.targetHours },
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
                <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(row)}>
                  {tc("edit")}
                </Button>
              ),
            },
          ]}
          rows={configs}
          rowKey={(row) => row.id}
          page={1}
          pageSize={Math.max(configs.length, 1)}
          total={configs.length}
          onPageChange={() => {}}
          loading={loading}
          emptyTitle={t("emptyTitle")}
          emptyDescription={t("emptyDescription")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-staff-border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-staff-border bg-staff-surface">
                <th className="sticky left-0 bg-staff-surface px-4 py-3 text-left font-medium text-staff-text">
                  {t("category")}
                </th>
                {matrix.columns.map((p) => (
                  <th key={p} className="px-4 py-3 text-left font-medium text-staff-text">
                    {t(`priorities.${p}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.categoryId ?? "all"} className="border-b border-staff-border/60">
                  <td className="sticky left-0 bg-staff-surface px-4 py-3 font-medium text-staff-text">
                    {row.categoryId ? row.categoryLabel : t("allCategories")}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.priority} className="px-4 py-3">
                      {cell.config ? (
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg border border-staff-border px-3 py-2 text-left hover:bg-staff-nav-hover"
                          onClick={() => openEdit(cell.config!)}
                        >
                          <span className="font-medium">{cell.config.targetHours}h</span>
                          {!cell.config.isActive ? (
                            <span className="ml-2 text-xs text-staff-text-muted">
                              ({t("status.inactive")})
                            </span>
                          ) : null}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg border border-dashed border-staff-border px-3 py-2 text-staff-text-muted hover:bg-staff-nav-hover"
                          onClick={() => openCreateFromCell(row.categoryId, cell.priority)}
                        >
                          {t("addCell")}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlaFormDialog
        open={formOpen}
        mode={editingConfig ? "edit" : "create"}
        config={editingConfig}
        presetCategoryId={presetCategoryId}
        presetPriority={presetPriority}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={() => void fetchData()}
      />
    </div>
  );
}
