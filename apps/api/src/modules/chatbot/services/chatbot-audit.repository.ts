import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ChatbotAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteExpiredSessions(cutoff: Date): Promise<number> {
    const where: Prisma.ChatSessionWhereInput = {
      expiresAt: { lt: cutoff },
    };
    return this.prisma.chatSession
      .deleteMany({ where })
      .then((result) => result.count);
  }

  deleteOldMessages(cutoff: Date): Promise<number> {
    const where: Prisma.ChatMessageWhereInput = {
      createdAt: { lt: cutoff },
    };
    return this.prisma.chatMessage
      .deleteMany({ where })
      .then((result) => result.count);
  }
}
