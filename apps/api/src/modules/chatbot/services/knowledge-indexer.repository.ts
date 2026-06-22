import { Injectable } from '@nestjs/common';
import {
  ComplaintLocale,
  KnowledgeArticleStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface IndexableArticle {
  id: string;
  slug: string;
  locale: ComplaintLocale;
  topic: string;
  bodyMarkdown: string;
  status: KnowledgeArticleStatus;
}

export interface CreatedKnowledgeChunk {
  id: string;
}

@Injectable()
export class KnowledgeIndexerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findArticleForIndex(articleId: string): Promise<IndexableArticle | null> {
    return this.prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        slug: true,
        locale: true,
        topic: true,
        bodyMarkdown: true,
        status: true,
      },
    });
  }

  deleteChunksByArticleId(articleId: string): Promise<void> {
    return this.prisma.knowledgeChunk
      .deleteMany({ where: { articleId } })
      .then(() => undefined);
  }

  createChunk(input: {
    articleId: string;
    chunkIndex: number;
    content: string;
    tokenCount: number;
    locale: ComplaintLocale;
    topic: string;
  }): Promise<CreatedKnowledgeChunk> {
    return this.prisma.knowledgeChunk.create({
      data: input,
      select: { id: true },
    });
  }

  setChunkEmbedding(chunkId: string, vectorLiteral: string): Promise<void> {
    return this.prisma
      .$executeRaw(
        Prisma.sql`UPDATE "KnowledgeChunk" SET embedding = ${vectorLiteral}::vector WHERE id = ${chunkId}`,
      )
      .then(() => undefined);
  }
}
