import { Injectable } from '@nestjs/common';
import { ComplaintLocale, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface BotMessageAnalyticsRow {
  confidence: string | null;
  contentRedacted: string;
}

export interface DailyAnalyticsUpsert {
  date: Date;
  locale: ComplaintLocale;
  questionsAnswered: number;
  questionsUnanswered: number;
  handoffs: number;
  deflectionRate: number | null;
  topUnansweredHashes: string[];
}

@Injectable()
export class ChatbotAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBotMessagesInRange(
    dayStart: Date,
    dayEnd: Date,
    locale: ComplaintLocale,
  ): Promise<BotMessageAnalyticsRow[]> {
    return this.prisma.chatMessage.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        role: 'BOT',
        session: { locale },
      },
      select: { confidence: true, contentRedacted: true },
    });
  }

  countHandoffMessages(
    dayStart: Date,
    dayEnd: Date,
    locale: ComplaintLocale,
  ): Promise<number> {
    const where: Prisma.ChatMessageWhereInput = {
      createdAt: { gte: dayStart, lt: dayEnd },
      session: { locale },
      contentRedacted: { contains: 'handoff', mode: 'insensitive' },
    };
    return this.prisma.chatMessage.count({ where });
  }

  upsertDailyAggregate(input: DailyAnalyticsUpsert): Promise<void> {
    const topUnansweredHashes =
      input.topUnansweredHashes as unknown as Prisma.InputJsonValue;
    return this.prisma.chatAnalyticsDaily
      .upsert({
        where: {
          date_locale: { date: input.date, locale: input.locale },
        },
        create: {
          date: input.date,
          locale: input.locale,
          questionsAnswered: input.questionsAnswered,
          questionsUnanswered: input.questionsUnanswered,
          handoffs: input.handoffs,
          deflectionRate: input.deflectionRate,
          topUnansweredHashes,
        },
        update: {
          questionsAnswered: input.questionsAnswered,
          questionsUnanswered: input.questionsUnanswered,
          handoffs: input.handoffs,
          deflectionRate: input.deflectionRate,
          topUnansweredHashes,
        },
      })
      .then(() => undefined);
  }

  listRecent(limit: number) {
    return this.prisma.chatAnalyticsDaily.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
