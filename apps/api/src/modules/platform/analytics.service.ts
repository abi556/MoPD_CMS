import { BadRequestException, Injectable } from '@nestjs/common';
import { ComplaintLocale, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecordAnalyticsEventsDto,
  WebAnalyticsEventDto,
} from './dto/record-analytics-events.dto';

const REFERENCE_PATTERN = /CMS-\d{4}-[A-Z0-9]{12}/i;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /\+?\d{10,}/;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvents(
    input: RecordAnalyticsEventsDto,
    correlationId?: string,
  ): Promise<{ recorded: number }> {
    const sessionId = input.sessionId.trim();
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    const rows = input.events.map((event) =>
      this.toCreateRow(event, sessionId, correlationId),
    );

    const result = await this.prisma.webAnalyticsEvent.createMany({
      data: rows,
    });

    return { recorded: result.count };
  }

  private toCreateRow(
    event: WebAnalyticsEventDto,
    sessionId: string,
    correlationId?: string,
  ): Prisma.WebAnalyticsEventCreateManyInput {
    return {
      sessionId,
      eventType: event.eventType,
      pagePath: this.sanitizePagePath(event.pagePath),
      locale: event.locale as ComplaintLocale | undefined,
      funnelName: event.funnelName?.trim() || null,
      funnelStep: event.funnelStep?.trim() || null,
      funnelPhase: event.funnelPhase?.trim() || null,
      deviceClass: event.deviceClass ?? null,
      referrerCategory: event.referrerCategory ?? null,
      correlationId: correlationId ?? null,
      metadata: this.sanitizeMetadata(event.metadata),
    };
  }

  private sanitizePagePath(path?: string): string | null {
    if (!path) return null;
    const trimmed = path.trim().slice(0, 256);
    const withoutQuery = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
    if (
      REFERENCE_PATTERN.test(withoutQuery) ||
      EMAIL_PATTERN.test(withoutQuery) ||
      PHONE_PATTERN.test(withoutQuery)
    ) {
      return null;
    }
    return withoutQuery || null;
  }

  private sanitizeMetadata(
    metadata?: Record<string, string | number | boolean>,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (!metadata || Object.keys(metadata).length === 0) {
      return Prisma.JsonNull;
    }

    const safe: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (key.length > 64) continue;
      if (typeof value === 'string') {
        if (
          REFERENCE_PATTERN.test(value) ||
          EMAIL_PATTERN.test(value) ||
          value.length > 128
        ) {
          continue;
        }
        safe[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        safe[key] = value;
      }
    }

    return Object.keys(safe).length > 0 ? safe : Prisma.JsonNull;
  }
}
