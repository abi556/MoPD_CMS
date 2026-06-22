import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  QUEUE_CHATBOT_ANALYTICS,
  QUEUE_KNOWLEDGE_INDEX,
} from '../../queue/queue.constants';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { KnowledgeAdminController } from './knowledge-admin.controller';
import { KnowledgeAdminService } from './knowledge-admin.service';
import { KnowledgeAdminRepository } from './knowledge-admin.repository';
import { ChatbotLlmService } from './services/chatbot-llm.service';
import { KnowledgeChunkerService } from './services/knowledge-chunker.service';
import { KnowledgeIndexerService } from './services/knowledge-indexer.service';
import { KnowledgeIndexerRepository } from './services/knowledge-indexer.repository';
import { KnowledgeRetrievalService } from './services/knowledge-retrieval.service';
import { PiiRedactionService } from './services/pii-redaction.service';
import { ScopeGuardService } from './services/scope-guard.service';
import { ChatbotPersistenceService } from './services/chatbot-persistence.service';
import { ChatbotPersistenceRepository } from './services/chatbot-persistence.repository';
import { ChatbotOrientationService } from './services/chatbot-orientation.service';
import { ChatbotAuditService } from './services/chatbot-audit.service';
import { ChatbotAuditRepository } from './services/chatbot-audit.repository';
import { ChatbotAnalyticsService } from './services/chatbot-analytics.service';
import { ChatbotAnalyticsRepository } from './services/chatbot-analytics.repository';
import { KnowledgeIndexProcessor } from './knowledge-index.processor';
import { ChatbotAnalyticsProcessor } from './chatbot-analytics.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: QUEUE_KNOWLEDGE_INDEX }),
    BullModule.registerQueue({ name: QUEUE_CHATBOT_ANALYTICS }),
  ],
  controllers: [ChatbotController, KnowledgeAdminController],
  providers: [
    ChatbotPersistenceRepository,
    ChatbotPersistenceService,
    ChatbotService,
    KnowledgeAdminRepository,
    KnowledgeAdminService,
    ChatbotLlmService,
    KnowledgeChunkerService,
    KnowledgeIndexerRepository,
    KnowledgeIndexerService,
    KnowledgeRetrievalService,
    PiiRedactionService,
    ScopeGuardService,
    ChatbotOrientationService,
    ChatbotAuditRepository,
    ChatbotAuditService,
    ChatbotAnalyticsRepository,
    ChatbotAnalyticsService,
    KnowledgeIndexProcessor,
    ChatbotAnalyticsProcessor,
  ],
  exports: [ChatbotService, KnowledgeAdminService],
})
export class ChatbotModule implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_CHATBOT_ANALYTICS)
    private readonly analyticsQueue: Queue,
    private readonly audit: ChatbotAuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    await this.analyticsQueue.add(
      'aggregate-daily',
      {},
      {
        repeat: { pattern: '0 2 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );
    void this.audit.purgeExpiredSessions();
  }
}
