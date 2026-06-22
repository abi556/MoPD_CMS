import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import type { ChatbotLlmService } from './chatbot-llm.service';
import type { PrismaService } from '../../../prisma/prisma.service';

describe('KnowledgeRetrievalService', () => {
  const llm = {} as ChatbotLlmService;
  const prisma = {} as PrismaService;
  const service = new KnowledgeRetrievalService(prisma, llm);

  it('maps high scores to high confidence', () => {
    expect(service.mapScoreToConfidence(0.9)).toBe('high');
  });

  it('maps medium scores to medium confidence', () => {
    expect(service.mapScoreToConfidence(0.7)).toBe('medium');
  });

  it('maps low scores to low confidence', () => {
    expect(service.mapScoreToConfidence(0.4)).toBe('low');
  });
});
