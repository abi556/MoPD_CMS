import { ForbiddenException } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import type { ScopeGuardService } from './services/scope-guard.service';
import type { PiiRedactionService } from './services/pii-redaction.service';
import type { KnowledgeRetrievalService } from './services/knowledge-retrieval.service';
import type { ChatbotLlmService } from './services/chatbot-llm.service';
import type { ChatbotAuditService } from './services/chatbot-audit.service';
import type { ChatbotPersistenceService } from './services/chatbot-persistence.service';
import type { ChatbotOrientationService } from './services/chatbot-orientation.service';
import { ComplaintLocale } from '@prisma/client';

describe('ChatbotService', () => {
  const persistence = {
    upsertSession: jest.fn().mockResolvedValue({
      sessionId: 'sess-1',
      turnCount: 20,
      locale: ComplaintLocale.en,
    }),
    createUserMessage: jest.fn(),
    createBotMessage: jest.fn(),
    incrementTurn: jest.fn(),
  } as unknown as ChatbotPersistenceService;

  const scopeGuard = {
    evaluateWithLlm: jest.fn(),
  } as unknown as ScopeGuardService;
  const orientation = {
    matchIntent: jest.fn().mockReturnValue(null),
    buildReply: jest.fn(),
  } as unknown as ChatbotOrientationService;
  const piiRedaction = {
    redact: jest.fn((v: string) => v),
  } as unknown as PiiRedactionService;
  const retrieval = {} as KnowledgeRetrievalService;
  const llmService = {} as ChatbotLlmService;
  const audit = {
    hashIp: jest.fn(),
  } as unknown as ChatbotAuditService;

  const service = new ChatbotService(
    persistence,
    scopeGuard,
    orientation,
    piiRedaction,
    retrieval,
    llmService,
    audit,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHATBOT_ENABLED = 'true';
    process.env.CHATBOT_SESSION_TURN_CAP = '20';
  });

  it('enforces session turn cap', async () => {
    await expect(
      service.handleMessage({
        sessionId: 'sess-1',
        message: 'hello',
        locale: ComplaintLocale.en,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
