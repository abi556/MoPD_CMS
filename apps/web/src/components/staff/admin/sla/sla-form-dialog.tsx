"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import type { CategoryItem } from "@/lib/staff/categories-api";
import type { RoleListItem } from "@/lib/staff/roles-api";
import { listRoles } from "@/lib/staff/roles-api";
import {
  createSlaConfig,
  updateSlaConfig,
  type SlaConfigItem,
  type SlaPriority,
} from "@/lib/staff/sla-api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";

export type SlaFormMode = "create" | "edit";

interface SlaFormDialogProps {
  open: boolean;
  mode: SlaFormMode;
  config: SlaConfigItem | null;
  presetCategoryId: string | null;
  presetPriority: SlaPriority | null;
  categories: CategoryItem[];
  onClose: () => void;
  onSaved: () => void;
}

export function SlaFormDialog({
  open,
  mode,
  config,
  presetCategoryId,
  presetPriority,
  categories,
  onClose,
  onSaved,
}: SlaFormDialogProps) {
  const t = useTranslations("admin.sla");
  const tc = useTranslations("admin.common");

  const [name, setName] = useState("");
  const [priority, setPriority] = useState<SlaPriority>("NORMAL");
  const [categoryId, setCategoryId] = useState("");
  const [targetHours, setTargetHours] = useState(24);
  const [warningThresholdPct, setWarningThresholdPct] = useState(80);
  const [escalationRoleId, setEscalationRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    void listRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    if (mode === "edit" && config) {
      setName(config.name);
      setPriority(config.priority);
      setCategoryId(config.categoryId ?? "");
      setTargetHours(config.targetHours);
      setWarningThresholdPct(config.warningThresholdPct);
      setEscalationRoleId(config.escalationRoleId ?? "");
      setIsActive(config.isActive);
    } else {
      setName("");
      setPriority(presetPriority ?? "NORMAL");
      setCategoryId(presetCategoryId ?? "");
      setTargetHours(24);
      setWarningThresholdPct(80);
      setEscalationRoleId("");
      setIsActive(true);
    }
  }, [open, mode, config, presetCategoryId, presetPriority]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const catId = categoryId || null;
      if (mode === "create") {
        await createSlaConfig({
          name: name.trim(),
          priority,
          categoryId: catId,
          targetHours,
          warningThresholdPct,
          escalationRoleId: escalationRoleId || null,
          isActive,
        });
      } else if (config) {
        await updateSlaConfig(config.id, {
          name: name.trim(),
          targetHours,
          warningThresholdPct,
          escalationRoleId: escalationRoleId || null,
          isActive,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tc("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("create") : t("edit")}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {tc("cancel")}
          </Button>
          <Button type="button" variant="brand" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? tc("loading") : tc("save")}
          </Button>
        </div>
      }
    >
      {error ? <AdminErrorAlert>{error}</AdminErrorAlert> : null}
      <div className="space-y-4">
        <Input label={t("name")} name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        {mode === "create" ? (
          <>
            <Select
              label={t("priority")}
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as SlaPriority)}
              options={[
                { value: "LOW", label: t("priorities.LOW") },
                { value: "NORMAL", label: t("priorities.NORMAL") },
                { value: "HIGH", label: t("priorities.HIGH") },
                { value: "URGENT", label: t("priorities.URGENT") },
              ]}
            />
            <Select
              label={t("category")}
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { value: "", label: t("allCategories") },
                ...categories.map((c) => ({ value: c.id, label: c.nameEn })),
              ]}
            />
          </>
        ) : null}
        <Input
          label={t("targetHours")}
          name="targetHours"
          type="number"
          min={1}
          value={String(targetHours)}
          onChange={(e) => setTargetHours(Number(e.target.value) || 1)}
        />
        <Input
          label={t("warningThreshold")}
          name="warningThresholdPct"
          type="number"
          min={1}
          max={99}
          value={String(warningThresholdPct)}
          onChange={(e) => setWarningThresholdPct(Number(e.target.value) || 80)}
        />
        <Select
          label={t("escalationRole")}
          name="escalationRoleId"
          value={escalationRoleId}
          onChange={(e) => setEscalationRoleId(e.target.value)}
          options={[
            { value: "", label: t("noEscalation") },
            ...roles.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        {mode === "edit" ? (
          <Select
            label={t("status.active")}
            name="isActive"
            value={isActive ? "true" : "false"}
            onChange={(e) => setIsActive(e.target.value === "true")}
            options={[
              { value: "true", label: t("status.active") },
              { value: "false", label: t("status.inactive") },
            ]}
          />
        ) : null}
      </div>
    </Dialog>
  );
}
