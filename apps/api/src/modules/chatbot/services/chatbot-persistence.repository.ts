import { Injectable } from '@nestjs/common';
import { ComplaintLocale, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ActiveChatSession,
  ChatSourcePayload,
  StoredChatConfidence,
} from './chatbot-persistence.types';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ChatbotPersistenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSession(input: {
    sessionId: string;
    locale: ComplaintLocale;
    ipHash: string | null;
  }): Promise<ActiveChatSession> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.prisma.chatSession.upsert({
      where: { sessionId: input.sessionId },
      create: {
        sessionId: input.sessionId,
        locale: input.locale,
        ipHash: input.ipHash,
        expiresAt,
      },
      update: {
        locale: input.locale,
        expiresAt,
      },
      select: {
        sessionId: true,
        turnCount: true,
        locale: true,
      },
    });
    return session;
  }

  async createUserMessage(
    sessionId: string,
    contentRedacted: string,
  ): Promise<void> {
    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        contentRedacted,
      },
    });
  }

  async createBotMessage(input: {
    sessionId: string;
    contentRedacted: string;
    confidence: StoredChatConfidence;
    sources: ChatSourcePayload[];
  }): Promise<void> {
    await this.prisma.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        role: 'BOT',
        contentRedacted: input.contentRedacted,
        confidence: input.confidence,
        sourcesJson: input.sources as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async incrementTurn(sessionId: string): Promise<void> {
    await this.prisma.chatSession.update({
      where: { sessionId },
      data: { turnCount: { increment: 1 } },
    });
  }
}
