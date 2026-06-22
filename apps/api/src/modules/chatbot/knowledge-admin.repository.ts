import { Injectable } from '@nestjs/common';
import {
  KnowledgeArticle,
  KnowledgeArticleStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateKnowledgeArticleDto,
  KnowledgeArticleListQueryDto,
  UpdateKnowledgeArticleDto,
} from './dto/knowledge-article.dto';

@Injectable()
export class KnowledgeAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findArticles(
    query: KnowledgeArticleListQueryDto,
  ): Promise<KnowledgeArticle[]> {
    const where: Prisma.KnowledgeArticleWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.locale) where.locale = query.locale;
    if (query.topic)
      where.topic = { contains: query.topic, mode: 'insensitive' };

    return this.prisma.knowledgeArticle.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  createArticle(
    dto: CreateKnowledgeArticleDto,
    userId: string,
  ): Promise<KnowledgeArticle> {
    return this.prisma.knowledgeArticle.create({
      data: {
        slug: dto.slug,
        locale: dto.locale,
        title: dto.title,
        bodyMarkdown: dto.bodyMarkdown,
        topic: dto.topic,
        sourceUrl: dto.sourceUrl,
        sourceType: dto.sourceType ?? 'MANUAL',
        status: KnowledgeArticleStatus.DRAFT,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
    });
  }

  findArticleById(id: string): Promise<KnowledgeArticle | null> {
    return this.prisma.knowledgeArticle.findUnique({ where: { id } });
  }

  updateArticle(
    id: string,
    dto: UpdateKnowledgeArticleDto,
    userId: string,
  ): Promise<KnowledgeArticle> {
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
    });
  }

  publishArticle(id: string, userId: string): Promise<KnowledgeArticle> {
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        status: KnowledgeArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        lastReviewedAt: new Date(),
        updatedByUserId: userId,
      },
    });
  }
}
