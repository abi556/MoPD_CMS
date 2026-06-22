import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatAnalyticsDaily, KnowledgeArticle, Prisma } from '@prisma/client';
import {
  CreateKnowledgeArticleDto,
  KnowledgeArticleListQueryDto,
  UpdateKnowledgeArticleDto,
} from './dto/knowledge-article.dto';
import { KnowledgeAdminRepository } from './knowledge-admin.repository';
import { KnowledgeIndexerService } from './services/knowledge-indexer.service';
import { ChatbotAnalyticsService } from './services/chatbot-analytics.service';

@Injectable()
export class KnowledgeAdminService {
  constructor(
    private readonly knowledgeRepo: KnowledgeAdminRepository,
    private readonly indexer: KnowledgeIndexerService,
    private readonly analytics: ChatbotAnalyticsService,
  ) {}

  list(query: KnowledgeArticleListQueryDto): Promise<KnowledgeArticle[]> {
    return this.knowledgeRepo.findArticles(query);
  }

  async create(
    dto: CreateKnowledgeArticleDto,
    userId: string,
  ): Promise<KnowledgeArticle> {
    try {
      return await this.knowledgeRepo.createArticle(dto, userId);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Article slug already exists for locale');
      }
      throw err;
    }
  }

  async update(
    id: string,
    dto: UpdateKnowledgeArticleDto,
    userId: string,
  ): Promise<KnowledgeArticle> {
    const existing = await this.knowledgeRepo.findArticleById(id);
    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    const updated = await this.knowledgeRepo.updateArticle(id, dto, userId);

    if (updated.status === 'PUBLISHED') {
      await this.indexer.enqueueArticleIndex(id);
    }

    return updated;
  }

  async publish(id: string, userId: string): Promise<KnowledgeArticle> {
    const article = await this.knowledgeRepo.publishArticle(id, userId);
    await this.indexer.enqueueArticleIndex(id);
    return article;
  }

  async reindex(id: string): Promise<{ queued: true; articleId: string }> {
    const article = await this.knowledgeRepo.findArticleById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    await this.indexer.enqueueArticleIndex(id);
    return { queued: true, articleId: id };
  }

  listAnalytics(): Promise<ChatAnalyticsDaily[]> {
    return this.analytics.listRecent();
  }
}
