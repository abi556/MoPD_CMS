"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  listNotificationTemplates,
  type NotificationTemplateItem,
} from "@/lib/staff/notification-templates-api";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";
import { TemplateEditorDialog } from "@/components/staff/admin/templates/template-editor-dialog";
import { Button } from "@/components/ui/button";

export function TemplatesAdminPanel() {
  const t = useTranslations("admin.templates");
  const tc = useTranslations("admin.common");

  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      const res = await listNotificationTemplates({ page: 1, pageSize: 100 });
      setTemplates(res.data);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const groupedKeys = useMemo(() => {
    const keys = new Set(templates.map((tpl) => tpl.key));
    return Array.from(keys).sort();
  }, [templates]);

  const enForKey = (key: string) =>
    templates.find((tpl) => tpl.key === key && tpl.locale === "en") ?? null;
  const amForKey = (key: string) =>
    templates.find((tpl) => tpl.key === key && tpl.locale === "am") ?? null;

  return (
    <div>
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />

      {listError ? (
        <div className="mb-4">
          <AdminErrorAlert>{listError}</AdminErrorAlert>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-staff-text-muted">{tc("loading")}</p>
      ) : groupedKeys.length === 0 ? (
        <p className="text-sm text-staff-text-muted">{t("emptyDescription")}</p>
      ) : (
        <ul className="space-y-3">
          {groupedKeys.map((key) => (
            <li
              key={key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-staff-border bg-staff-surface px-4 py-3"
            >
              <div>
                <p className="font-medium text-staff-text">{key}</p>
                <p className="text-xs text-staff-text-muted">
                  {enForKey(key)?.subject ?? t("missingLocale")}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setEditingKey(key)}>
                {tc("edit")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editingKey ? (
        <TemplateEditorDialog
          open
          templateKey={editingKey}
          enTemplate={enForKey(editingKey)}
          amTemplate={amForKey(editingKey)}
          onClose={() => setEditingKey(null)}
          onSaved={() => void fetchTemplates()}
        />
      ) : null}
    </div>
  );
}
