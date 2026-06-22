import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_CHATBOT_ANALYTICS } from '../../queue/queue.constants';
import { ChatbotAnalyticsService } from './services/chatbot-analytics.service';

@Processor(QUEUE_CHATBOT_ANALYTICS)
export class ChatbotAnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatbotAnalyticsProcessor.name);

  constructor(private readonly analytics: ChatbotAnalyticsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(
      `Running chatbot analytics aggregation (job ${job.id ?? 'unknown'})`,
    );
    await this.analytics.aggregateDaily();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Chatbot analytics job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
