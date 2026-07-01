"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import {
  createKnowledgeArticle,
  listKnowledgeArticles,
  publishKnowledgeArticle,
  reindexKnowledgeArticle,
  updateKnowledgeArticle,
  type KnowledgeArticle,
  type KnowledgeArticleStatus,
  type KnowledgeLocale,
} from "@/lib/staff/knowledge-api";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import {
  AdminErrorAlert,
  AdminStatusBadge,
} from "@/components/staff/admin/shared/admin-status-badge";
import { StaffDataTable } from "@/components/staff/ui/staff-data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type StatusFilter = "all" | KnowledgeArticleStatus;

export function KnowledgeAdminPanel() {
  const t = useTranslations("admin.knowledge");
  const tc = useTranslations("admin.common");

  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [localeFilter, setLocaleFilter] = useState<"all" | KnowledgeLocale>("all");
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState<KnowledgeLocale>("en");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("general");
  const [sourceUrl, setSourceUrl] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [formScrollToken, setFormScrollToken] = useState(0);

  const formRef = useRef<HTMLDivElement>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setListError(undefined);
    try {
      const data = await listKnowledgeArticles({
        status: statusFilter === "all" ? undefined : statusFilter,
        locale: localeFilter === "all" ? undefined : localeFilter,
      });
      setArticles(data);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [localeFilter, statusFilter, tc]);

  useEffect(() => {
     
    void fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filters change
  }, [localeFilter, statusFilter]);

  const showForm = creating || editing;

  useEffect(() => {
    if (!showForm || formScrollToken === 0) return;

    const formEl = formRef.current;
    if (!formEl) return;

    formEl.scrollIntoView({ behavior: "smooth", block: "start" });

    const focusTimer = window.setTimeout(() => {
      formEl.querySelector<HTMLInputElement>('input[name="title"]')?.focus({
        preventScroll: true,
      });
    }, 320);

    return () => window.clearTimeout(focusTimer);
  }, [formScrollToken, showForm]);

  const requestFormFocus = useCallback(() => {
    setFormScrollToken((token) => token + 1);
  }, []);

  const resetForm = useCallback(() => {
    setSlug("");
    setLocale("en");
    setTitle("");
    setTopic("general");
    setSourceUrl("");
    setBodyMarkdown("");
    setFormError(undefined);
    setEditing(null);
    setCreating(false);
  }, []);

  const openCreate = () => {
    resetForm();
    setCreating(true);
    requestFormFocus();
  };

  const openEdit = useCallback(
    (article: KnowledgeArticle) => {
      setEditing(article);
      setCreating(false);
      setSlug(article.slug);
      setLocale(article.locale);
      setTitle(article.title);
      setTopic(article.topic);
      setSourceUrl(article.sourceUrl ?? "");
      setBodyMarkdown(article.bodyMarkdown);
      setFormError(undefined);
      requestFormFocus();
    },
    [requestFormFocus],
  );

  const handleSave = async () => {
    setSaving(true);
    setFormError(undefined);
    try {
      if (editing) {
        await updateKnowledgeArticle(editing.id, {
          slug,
          title,
          topic,
          sourceUrl: sourceUrl || null,
          bodyMarkdown,
        });
      } else {
        await createKnowledgeArticle({
          slug,
          locale,
          title,
          topic,
          sourceUrl: sourceUrl || undefined,
          bodyMarkdown,
        });
      }
      resetForm();
      await fetchArticles();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = useCallback(
    async (id: string) => {
      try {
        await publishKnowledgeArticle(id);
        await fetchArticles();
      } catch (err) {
        setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      }
    },
    [fetchArticles, tc],
  );

  const handleReindex = useCallback(
    async (id: string) => {
      try {
        await reindexKnowledgeArticle(id);
      } catch (err) {
        setListError(err instanceof ApiError ? err.message : tc("errorGeneric"));
      }
    },
    [tc],
  );

  const columns = useMemo(
    () => [
      {
        id: "title",
        header: t("titleField"),
        cell: (row: KnowledgeArticle) => row.title,
      },
      {
        id: "slug",
        header: t("slug"),
        cell: (row: KnowledgeArticle) => row.slug,
      },
      {
        id: "locale",
        header: t("locale"),
        cell: (row: KnowledgeArticle) => row.locale,
      },
      {
        id: "topic",
        header: t("topic"),
        cell: (row: KnowledgeArticle) => row.topic,
      },
      {
        id: "status",
        header: t("status"),
        cell: (row: KnowledgeArticle) => (
          <AdminStatusBadge
            active={row.status === "PUBLISHED"}
            activeLabel={t("statusPublished")}
            inactiveLabel={t("statusDraft")}
          />
        ),
      },
      {
        id: "updated",
        header: t("updated"),
        cell: (row: KnowledgeArticle) =>
          new Date(row.updatedAt).toLocaleString(),
      },
      {
        id: "actions",
        header: tc("actions"),
        cell: (row: KnowledgeArticle) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={editing?.id === row.id ? "primary" : "secondary"}
              aria-pressed={editing?.id === row.id}
              onClick={() => openEdit(row)}
            >
              {editing?.id === row.id ? t("editingButton") : tc("edit")}
            </Button>
            {row.status !== "PUBLISHED" ? (
              <Button type="button" onClick={() => void handlePublish(row.id)}>
                {t("publish")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleReindex(row.id)}
              >
                {t("reindex")}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [editing?.id, handlePublish, handleReindex, openEdit, t, tc],
  );

  return (
    <div>
      <DashboardPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button type="button" onClick={openCreate}>
            {t("create")}
          </Button>
        }
      />

      {listError ? (
        <div className="mb-4">
          <AdminErrorAlert>{listError}</AdminErrorAlert>
        </div>
      ) : null}

      {showForm ? (
        <div
          ref={formRef}
          id="knowledge-article-form"
          role="region"
          aria-labelledby="knowledge-article-form-title"
          tabIndex={-1}
          className="mb-6 scroll-mt-24 space-y-3 rounded-xl border-2 border-staff-nav-active/50 bg-staff-surface p-4 shadow-staff-card ring-2 ring-staff-nav-active/20"
        >
          <div className="space-y-1">
            <h3
              id="knowledge-article-form-title"
              className="font-medium text-staff-text"
            >
              {editing ? t("editArticle") : t("newArticle")}
            </h3>
            {editing ? (
              <p className="text-sm text-staff-text-muted">
                {t("editingArticle", { title: editing.title })}
              </p>
            ) : null}
          </div>
          {formError ? <AdminErrorAlert>{formError}</AdminErrorAlert> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label={t("slug")}
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            {!editing ? (
              <Select
                label={t("locale")}
                name="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as KnowledgeLocale)}
                options={[
                  { value: "en", label: "English" },
                  { value: "am", label: "አማርኛ" },
                ]}
              />
            ) : (
              <Input label={t("locale")} name="locale" value={locale} readOnly disabled />
            )}
            <Input
              label={t("titleField")}
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label={t("topic")}
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Input
              label={t("sourceUrl")}
              name="sourceUrl"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="md:col-span-2"
            />
          </div>
          <Textarea
            label={t("bodyMarkdown")}
            name="bodyMarkdown"
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            rows={12}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {tc("save")}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              {tc("cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          label={t("filterStatus")}
          name="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          options={[
            { value: "all", label: t("filterAllStatus") },
            { value: "DRAFT", label: t("statusDraft") },
            { value: "PUBLISHED", label: t("statusPublished") },
            { value: "ARCHIVED", label: t("statusArchived") },
          ]}
        />
        <Select
          label={t("filterLocale")}
          name="localeFilter"
          value={localeFilter}
          onChange={(e) =>
            setLocaleFilter(e.target.value as "all" | KnowledgeLocale)
          }
          options={[
            { value: "all", label: t("filterAllLocales") },
            { value: "en", label: "English" },
            { value: "am", label: "አማርኛ" },
          ]}
        />
      </div>

      {editing ? (
        <p className="mb-3 text-sm text-staff-text-muted">{t("formHint")}</p>
      ) : null}

      <StaffDataTable
        columns={columns}
        rows={articles}
        rowKey={(row) => row.id}
        activeRowKey={editing?.id}
        page={1}
        pageSize={50}
        total={articles.length}
        onPageChange={() => undefined}
        loading={loading}
        hidePagination
        emptyTitle={t("empty")}
      />
    </div>
  );
}
