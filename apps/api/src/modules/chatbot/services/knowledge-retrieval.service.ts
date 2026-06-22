import { Injectable } from '@nestjs/common';
import { ComplaintLocale } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { loadChatbotConfig } from '../chatbot.config';
import { ChatbotLlmService } from './chatbot-llm.service';

export type RetrievalConfidence = 'high' | 'medium' | 'low';

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  sourceUrl: string | null;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  confidence: RetrievalConfidence;
  topScore: number;
}

@Injectable()
export class KnowledgeRetrievalService {
  private readonly config = loadChatbotConfig();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: ChatbotLlmService,
  ) {}

  async retrieve(
    query: string,
    locale: ComplaintLocale,
  ): Promise<RetrievalResult> {
    let embedding: number[];
    try {
      embedding = await this.llmService.embedText(query);
    } catch {
      return { chunks: [], confidence: 'low', topScore: 0 };
    }

    const vectorLiteral = `[${embedding.join(',')}]`;
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        score: number;
        articleId: string;
        articleSlug: string;
        articleTitle: string;
        sourceUrl: string | null;
      }>
    >(
      `
      SELECT
        kc.id,
        kc.content,
        1 - (kc.embedding <=> $1::vector) AS score,
        ka.id AS "articleId",
        ka.slug AS "articleSlug",
        ka.title AS "articleTitle",
        ka."sourceUrl"
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeArticle" ka ON ka.id = kc."articleId"
      WHERE kc.embedding IS NOT NULL
        AND kc.locale = $2::"ComplaintLocale"
        AND ka.status = 'PUBLISHED'::"KnowledgeArticleStatus"
      ORDER BY kc.embedding <=> $1::vector
      LIMIT 5
      `,
      vectorLiteral,
      locale,
    );

    const chunks: RetrievedChunk[] = rows.map((row) => ({
      id: row.id,
      content: row.content,
      score: Number(row.score),
      articleId: row.articleId,
      articleSlug: row.articleSlug,
      articleTitle: row.articleTitle,
      sourceUrl: row.sourceUrl,
    }));

    const topScore = chunks[0]?.score ?? 0;
    const confidence = this.mapScoreToConfidence(topScore);

    return { chunks, confidence, topScore };
  }

  mapScoreToConfidence(score: number): RetrievalConfidence {
    if (score >= this.config.retrievalMinScore) {
      return 'high';
    }
    if (score >= this.config.retrievalMinScore - 0.12) {
      return 'medium';
    }
    return 'low';
  }
}
