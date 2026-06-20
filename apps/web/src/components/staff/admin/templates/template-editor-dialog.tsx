"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  createNotificationTemplate,
  listNotificationTemplates,
  updateNotificationTemplate,
  type NotificationTemplateItem,
} from "@/lib/staff/notification-templates-api";
import {
  formatVariableHint,
  getTemplateVariableHints,
} from "@/lib/staff/template-variables";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminErrorAlert } from "@/components/staff/admin/shared/admin-status-badge";

interface LocaleFields {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

interface TemplateEditorDialogProps {
  open: boolean;
  templateKey: string;
  enTemplate: NotificationTemplateItem | null;
  amTemplate: NotificationTemplateItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateEditorDialog({
  open,
  templateKey,
  enTemplate,
  amTemplate,
  onClose,
  onSaved,
}: TemplateEditorDialogProps) {
  const t = useTranslations("admin.templates");
  const tc = useTranslations("admin.common");

  const [en, setEn] = useState<LocaleFields>({ subject: "", bodyHtml: "", bodyText: "" });
  const [am, setAm] = useState<LocaleFields>({ subject: "", bodyHtml: "", bodyText: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const hints = getTemplateVariableHints(templateKey);

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    setEn({
      subject: enTemplate?.subject ?? "",
      bodyHtml: enTemplate?.bodyHtml ?? "",
      bodyText: enTemplate?.bodyText ?? "",
    });
    setAm({
      subject: amTemplate?.subject ?? "",
      bodyHtml: amTemplate?.bodyHtml ?? "",
      bodyText: amTemplate?.bodyText ?? "",
    });
  }, [open, enTemplate, amTemplate]);

  const saveLocale = async (
    locale: "en" | "am",
    existing: NotificationTemplateItem | null,
    fields: LocaleFields,
  ) => {
    if (existing) {
      await updateNotificationTemplate(existing.id, {
        subject: fields.subject,
        bodyHtml: fields.bodyHtml,
        bodyText: fields.bodyText || undefined,
      });
    } else {
      await createNotificationTemplate({
        key: templateKey,
        locale,
        channel: "email",
        subject: fields.subject,
        bodyHtml: fields.bodyHtml,
        bodyText: fields.bodyText || undefined,
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await saveLocale("en", enTemplate, en);
      await saveLocale("am", amTemplate, am);
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
      tone="staff"
      title={t("editTitle", { key: templateKey })}
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

      {hints.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-xs font-medium text-staff-text-muted">{t("variables")}:</span>
          {hints.map((hint) => (
            <code
              key={hint}
              className="rounded bg-staff-input-bg px-2 py-0.5 text-xs text-staff-text"
            >
              {formatVariableHint(hint)}
            </code>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {(["en", "am"] as const).map((locale) => {
          const fields = locale === "en" ? en : am;
          const setFields = locale === "en" ? setEn : setAm;
          return (
            <div key={locale} className="space-y-3">
              <h3 className="font-medium text-staff-text">
                {locale === "en" ? t("localeEn") : t("localeAm")}
              </h3>
              <Input
                label={t("subject")}
                name={`${locale}-subject`}
                value={fields.subject}
                onChange={(e) => setFields((f) => ({ ...f, subject: e.target.value }))}
              />
              <label className="block text-sm font-medium text-staff-text">
                {t("bodyHtml")}
                <textarea
                  className="mt-1 min-h-[8rem] w-full rounded-xl border border-staff-border bg-staff-input-bg px-3 py-2 font-mono text-sm text-staff-text"
                  value={fields.bodyHtml}
                  onChange={(e) => setFields((f) => ({ ...f, bodyHtml: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-staff-text">
                {t("bodyText")}
                <textarea
                  className="mt-1 min-h-[5rem] w-full rounded-xl border border-staff-border bg-staff-input-bg px-3 py-2 font-mono text-sm text-staff-text"
                  value={fields.bodyText}
                  onChange={(e) => setFields((f) => ({ ...f, bodyText: e.target.value }))}
                />
              </label>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
