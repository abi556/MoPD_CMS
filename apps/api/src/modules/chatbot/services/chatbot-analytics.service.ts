import { Injectable, Logger } from '@nestjs/common';
import { ChatAnalyticsDaily, ComplaintLocale } from '@prisma/client';
import { createHash } from 'crypto';
import { ChatbotAnalyticsRepository } from './chatbot-analytics.repository';

@Injectable()
export class ChatbotAnalyticsService {
  private readonly logger = new Logger(ChatbotAnalyticsService.name);

  constructor(private readonly analyticsRepo: ChatbotAnalyticsRepository) {}

  hashQuery(query: string): string {
    return createHash('sha256')
      .update(query.trim().toLowerCase())
      .digest('hex');
  }

  async aggregateDaily(date = new Date()): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    for (const locale of [ComplaintLocale.en, ComplaintLocale.am] as const) {
      const messages = await this.analyticsRepo.findBotMessagesInRange(
        dayStart,
        dayEnd,
        locale,
      );

      const answered = messages.filter(
        (m) => m.confidence === 'VERIFIED' || m.confidence === 'GUIDANCE_ONLY',
      ).length;
      const unanswered = messages.filter(
        (m) => m.confidence === 'GUIDANCE_ONLY',
      ).length;

      const handoffs = await this.analyticsRepo.countHandoffMessages(
        dayStart,
        dayEnd,
        locale,
      );

      const total = answered + unanswered;
      const deflectionRate = total > 0 ? answered / total : null;

      const unansweredHashes = messages
        .filter((m) => m.confidence === 'GUIDANCE_ONLY')
        .map((m) => this.hashQuery(m.contentRedacted))
        .slice(0, 20);

      await this.analyticsRepo.upsertDailyAggregate({
        date: dayStart,
        locale,
        questionsAnswered: answered,
        questionsUnanswered: unanswered,
        handoffs,
        deflectionRate,
        topUnansweredHashes: unansweredHashes,
      });
    }

    this.logger.log(
      `Aggregated chatbot analytics for ${dayStart.toISOString().slice(0, 10)}`,
    );
  }

  listRecent(limit = 30): Promise<ChatAnalyticsDaily[]> {
    return this.analyticsRepo.listRecent(limit);
  }
}
