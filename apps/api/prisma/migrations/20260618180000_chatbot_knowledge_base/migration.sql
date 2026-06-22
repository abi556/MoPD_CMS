-- Melhiq chatbot knowledge base + pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "KnowledgeArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('FAQ', 'OFFICIAL', 'REFERENCE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'BOT');

-- CreateEnum
CREATE TYPE "ChatConfidence" AS ENUM ('VERIFIED', 'GUIDANCE_ONLY', 'REFUSED');

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" "ComplaintLocale" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceUrl" TEXT,
    "sourceType" "KnowledgeSourceType" NOT NULL DEFAULT 'MANUAL',
    "lastReviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "locale" "ComplaintLocale" NOT NULL,
    "topic" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipHash" TEXT,
    "locale" "ComplaintLocale" NOT NULL,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "contentRedacted" TEXT NOT NULL,
    "confidence" "ChatConfidence",
    "sourcesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAnalyticsDaily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "locale" "ComplaintLocale" NOT NULL,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "questionsUnanswered" INTEGER NOT NULL DEFAULT 0,
    "handoffs" INTEGER NOT NULL DEFAULT 0,
    "deflectionRate" DOUBLE PRECISION,
    "topUnansweredHashes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_locale_key" ON "KnowledgeArticle"("slug", "locale");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_status_locale_idx" ON "KnowledgeArticle"("status", "locale");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_topic_idx" ON "KnowledgeArticle"("topic");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_articleId_idx" ON "KnowledgeChunk"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_locale_idx" ON "KnowledgeChunk"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON "ChatSession"("sessionId");

-- CreateIndex
CREATE INDEX "ChatSession_expiresAt_idx" ON "ChatSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAnalyticsDaily_date_locale_key" ON "ChatAnalyticsDaily"("date", "locale");

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- pgvector similarity index (cosine)
CREATE INDEX "KnowledgeChunk_embedding_hnsw_idx" ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops);
