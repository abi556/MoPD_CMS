import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_KNOWLEDGE_INDEX } from '../../queue/queue.constants';
import {
  KnowledgeIndexerService,
  type KnowledgeIndexJobData,
} from './services/knowledge-indexer.service';

@Processor(QUEUE_KNOWLEDGE_INDEX)
export class KnowledgeIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeIndexProcessor.name);

  constructor(private readonly indexer: KnowledgeIndexerService) {
    super();
  }

  async process(job: Job<KnowledgeIndexJobData>): Promise<void> {
    await this.indexer.indexArticle(job.data.articleId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Knowledge index job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
