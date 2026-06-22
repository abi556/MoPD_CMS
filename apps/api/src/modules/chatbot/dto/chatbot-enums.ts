/** Mirror Prisma enums — use for validators/Swagger when @prisma/client types are unresolved in the IDE. */

export const COMPLAINT_LOCALE_VALUES = ['en', 'am'] as const;
export type ChatbotLocale = (typeof COMPLAINT_LOCALE_VALUES)[number];

export const KNOWLEDGE_ARTICLE_STATUS_VALUES = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export type KnowledgeArticleStatusValue =
  (typeof KNOWLEDGE_ARTICLE_STATUS_VALUES)[number];

export const KNOWLEDGE_SOURCE_TYPE_VALUES = [
  'FAQ',
  'OFFICIAL',
  'REFERENCE',
  'MANUAL',
] as const;
export type KnowledgeSourceTypeValue =
  (typeof KNOWLEDGE_SOURCE_TYPE_VALUES)[number];
