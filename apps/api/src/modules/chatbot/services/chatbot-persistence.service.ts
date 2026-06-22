import { Injectable } from '@nestjs/common';
import { ComplaintLocale } from '@prisma/client';
import { ChatbotPersistenceRepository } from './chatbot-persistence.repository';
import type {
  ActiveChatSession,
  ChatSourcePayload,
  StoredChatConfidence,
} from './chatbot-persistence.types';

export type {
  ActiveChatSession,
  ChatSourcePayload,
  StoredChatConfidence,
} from './chatbot-persistence.types';

@Injectable()
export class ChatbotPersistenceService {
  constructor(private readonly persistenceRepo: ChatbotPersistenceRepository) {}

  upsertSession(input: {
    sessionId: string;
    locale: ComplaintLocale;
    ipHash: string | null;
  }): Promise<ActiveChatSession> {
    return this.persistenceRepo.upsertSession(input);
  }

  createUserMessage(sessionId: string, contentRedacted: string): Promise<void> {
    return this.persistenceRepo.createUserMessage(sessionId, contentRedacted);
  }

  createBotMessage(input: {
    sessionId: string;
    contentRedacted: string;
    confidence: StoredChatConfidence;
    sources: ChatSourcePayload[];
  }): Promise<void> {
    return this.persistenceRepo.createBotMessage(input);
  }

  incrementTurn(sessionId: string): Promise<void> {
    return this.persistenceRepo.incrementTurn(sessionId);
  }
}
