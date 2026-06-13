"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import type { ReferenceDataItem } from "@/lib/staff/reference-data-tree";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";

export type ReferenceDataFormMode = "create" | "edit";

export interface ReferenceDataFormValues {
  code: string;
  nameEn: string;
  nameAm: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
}

interface ReferenceDataFormDialogProps {
  open: boolean;
  mode: ReferenceDataFormMode;
  item: ReferenceDataItem | null;
  parents: ReferenceDataItem[];
  translationNamespace: "admin.categories" | "admin.orgUnits";
  onClose: () => void;
  onSubmit: (values: ReferenceDataFormValues) => Promise<void>;
}

export function ReferenceDataFormDialog({
  open,
  mode,
  item,
  parents,
  translationNamespace,
  onClose,
  onSubmit,
}: ReferenceDataFormDialogProps) {
  const t = useTranslations(translationNamespace);
  const tc = useTranslations("admin.common");

  const [code, setCode] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    if (mode === "edit" && item) {
      setCode(item.code);
      setNameEn(item.nameEn);
      setNameAm(item.nameAm ?? "");
      setParentId(item.parentId ?? "");
      setSortOrder(item.sortOrder);
      setIsActive(item.isActive);
    } else {
      setCode("");
      setNameEn("");
      setNameAm("");
      setParentId("");
      setSortOrder(0);
      setIsActive(true);
    }
  }, [open, mode, item]);

  const parentOptions = parents
    .filter((p) => p.id !== item?.id)
    .map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.nameEn}`,
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await onSubmit({
        code: code.trim(),
        nameEn: nameEn.trim(),
        nameAm: nameAm.trim(),
        parentId,
        sortOrder,
        isActive,
      });
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
        <Input
          label={t("code")}
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          hint={t("codeHint")}
          required
          disabled={mode === "edit"}
        />
        <Input
          label={t("nameEn")}
          name="nameEn"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
        />
        <Input
          label={t("nameAm")}
          name="nameAm"
          value={nameAm}
          onChange={(e) => setNameAm(e.target.value)}
        />
        <Select
          label={t("parent")}
          name="parentId"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          options={[{ value: "", label: t("noParent") }, ...parentOptions]}
        />
        <Input
          label={t("sortOrder")}
          name="sortOrder"
          type="number"
          min={0}
          value={String(sortOrder)}
          onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
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
