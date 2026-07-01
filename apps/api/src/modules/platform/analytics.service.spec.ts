import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService', () => {
  const createMany = jest.fn().mockResolvedValue({ count: 1 });
  const service = new AnalyticsService({
    webAnalyticsEvent: { createMany },
  } as unknown as PrismaService);

  beforeEach(() => {
    createMany.mockClear();
  });

  it('stores sanitized analytics events', async () => {
    const result = await service.recordEvents(
      {
        sessionId: 'session-abc',
        events: [
          {
            eventType: 'page.view',
            pagePath: '/en/complaints/new?utm=bad',
            locale: 'en',
            deviceClass: 'mobile',
            referrerCategory: 'direct',
          },
        ],
      },
      'corr-1',
    );

    expect(result.recorded).toBe(1);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          sessionId: 'session-abc',
          eventType: 'page.view',
          pagePath: '/en/complaints/new',
          locale: 'en',
          correlationId: 'corr-1',
        }),
      ],
    });
  });

  it('drops page paths that may contain personal data', async () => {
    await service.recordEvents({
      sessionId: 'session-abc',
      events: [
        {
          eventType: 'track.search_success',
          pagePath: '/en/complaints/track/CMS-2026-ABCDEF123456',
        },
      ],
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ pagePath: null })],
    });
  });

  it('strips personal data from metadata values', async () => {
    await service.recordEvents({
      sessionId: 'session-abc',
      events: [
        {
          eventType: 'chat.quick_action',
          metadata: {
            quickActionId: 'track',
            email: 'citizen@example.com',
            count: 1,
          },
        },
      ],
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          metadata: { quickActionId: 'track', count: 1 },
        }),
      ],
    });
  });

  it('records funnel events with locale and step', async () => {
    const result = await service.recordEvents({
      sessionId: 'session-funnel',
      events: [
        {
          eventType: 'funnel.step_view',
          funnelName: 'complaint_submit',
          funnelStep: 'details',
          funnelPhase: 'wizard',
          locale: 'am',
        },
      ],
    });

    expect(result.recorded).toBe(1);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          eventType: 'funnel.step_view',
          funnelName: 'complaint_submit',
          funnelStep: 'details',
          locale: 'am',
        }),
      ],
    });
  });

  it('rejects empty session ids', async () => {
    await expect(
      service.recordEvents({
        sessionId: '   ',
        events: [{ eventType: 'page.view' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('drops phone numbers from page paths', async () => {
    await service.recordEvents({
      sessionId: 'session-phone',
      events: [
        {
          eventType: 'page.view',
          pagePath: '/en/contact/09123456789',
        },
        {
          eventType: 'contact.submit_success',
          metadata: {
            channel: 'web',
            ok: true,
          },
        },
      ],
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ pagePath: null }),
        expect.objectContaining({
          metadata: { channel: 'web', ok: true },
        }),
      ],
    });
  });

  it('returns JsonNull for empty or unsafe metadata', async () => {
    await service.recordEvents({
      sessionId: 'session-meta',
      events: [
        { eventType: 'page.view', metadata: {} },
        {
          eventType: 'page.view',
          metadata: {
            [`${'x'.repeat(65)}`]: 'value',
            longValue: 'a'.repeat(129),
          },
        },
      ],
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ metadata: Prisma.JsonNull }),
        expect.objectContaining({ metadata: Prisma.JsonNull }),
      ],
    });
  });
});
