import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type KnowledgeArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type KnowledgeSourceType = "FAQ" | "OFFICIAL" | "REFERENCE" | "MANUAL";
export type KnowledgeLocale = "en" | "am";

export interface KnowledgeArticle {
  id: string;
  slug: string;
  locale: KnowledgeLocale;
  title: string;
  bodyMarkdown: string;
  topic: string;
  status: KnowledgeArticleStatus;
  sourceUrl: string | null;
  sourceType: KnowledgeSourceType;
  lastReviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticleInput {
  slug: string;
  locale: KnowledgeLocale;
  title: string;
  bodyMarkdown: string;
  topic: string;
  sourceUrl?: string;
  sourceType?: KnowledgeSourceType;
}

export interface KnowledgeArticleUpdate {
  slug?: string;
  title?: string;
  bodyMarkdown?: string;
  topic?: string;
  sourceUrl?: string | null;
  sourceType?: KnowledgeSourceType;
  status?: KnowledgeArticleStatus;
}

export async function listKnowledgeArticles(params?: {
  status?: KnowledgeArticleStatus;
  locale?: KnowledgeLocale;
  topic?: string;
}): Promise<KnowledgeArticle[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.locale) search.set("locale", params.locale);
  if (params?.topic) search.set("topic", params.topic);
  const qs = search.toString();
  return apiGet<KnowledgeArticle[]>(
    `/admin/knowledge/articles${qs ? `?${qs}` : ""}`,
  );
}

export async function createKnowledgeArticle(
  payload: KnowledgeArticleInput,
): Promise<KnowledgeArticle> {
  return apiPost<KnowledgeArticle>("/admin/knowledge/articles", payload);
}

export async function updateKnowledgeArticle(
  id: string,
  payload: KnowledgeArticleUpdate,
): Promise<KnowledgeArticle> {
  return apiPatch<KnowledgeArticle>(`/admin/knowledge/articles/${id}`, payload);
}

export async function publishKnowledgeArticle(
  id: string,
): Promise<KnowledgeArticle> {
  return apiPost<KnowledgeArticle>(`/admin/knowledge/articles/${id}/publish`);
}

export async function reindexKnowledgeArticle(
  id: string,
): Promise<{ queued: boolean; articleId: string }> {
  return apiPost<{ queued: boolean; articleId: string }>(
    `/admin/knowledge/articles/${id}/reindex`,
  );
}
