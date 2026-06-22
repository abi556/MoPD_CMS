import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_KNOWLEDGE_INDEX } from '../../../queue/queue.constants';
import { KnowledgeChunkerService } from './knowledge-chunker.service';
import { ChatbotLlmService } from './chatbot-llm.service';
import { KnowledgeIndexerRepository } from './knowledge-indexer.repository';

export interface KnowledgeIndexJobData {
  articleId: string;
}

@Injectable()
export class KnowledgeIndexerService {
  private readonly logger = new Logger(KnowledgeIndexerService.name);

  constructor(
    private readonly indexerRepo: KnowledgeIndexerRepository,
    private readonly chunker: KnowledgeChunkerService,
    private readonly llmService: ChatbotLlmService,
    @InjectQueue(QUEUE_KNOWLEDGE_INDEX)
    private readonly indexQueue: Queue<KnowledgeIndexJobData>,
  ) {}

  async enqueueArticleIndex(articleId: string): Promise<void> {
    await this.indexQueue.add(
      'index-article',
      { articleId },
      { removeOnComplete: 100, removeOnFail: 50 },
    );
  }

  async indexArticle(articleId: string): Promise<void> {
    const article = await this.indexerRepo.findArticleForIndex(articleId);
    if (!article || article.status !== 'PUBLISHED') {
      await this.indexerRepo.deleteChunksByArticleId(articleId);
      return;
    }

    const drafts = this.chunker.chunkMarkdown(article.bodyMarkdown);
    await this.indexerRepo.deleteChunksByArticleId(articleId);

    for (const draft of drafts) {
      const chunk = await this.indexerRepo.createChunk({
        articleId,
        chunkIndex: draft.chunkIndex,
        content: draft.content,
        tokenCount: draft.tokenCount,
        locale: article.locale,
        topic: article.topic,
      });

      try {
        const embedding = await this.llmService.embedText(draft.content);
        const vectorLiteral = `[${embedding.join(',')}]`;
        await this.indexerRepo.setChunkEmbedding(chunk.id, vectorLiteral);
      } catch (err) {
        this.logger.warn(
          `Embedding failed for chunk ${chunk.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.log(
      `Indexed article ${article.slug} (${article.locale}) with ${drafts.length} chunks`,
    );
  }
}
