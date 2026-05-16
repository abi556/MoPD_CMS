import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NOTIFICATION_DISPATCH } from '../../queue/queue.constants';
import { EmailProviderFactory } from './providers/email-provider.factory';
import {
  buildPublicTrackUrl,
  NotificationsService,
} from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const notificationTemplateUpsert = jest.fn();
  const notificationDeliveryCreate = jest.fn();
  const notificationDeliveryFindUnique = jest.fn();
  const notificationDeliveryUpdate = jest.fn();
  const notificationTemplateFindUnique = jest.fn();
  const logEvent = jest.fn();
  const queueAdd = jest.fn();
  const emailSend = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    notificationTemplateFindUnique.mockImplementation(
      (args: { where: Record<string, unknown> }) => {
        const w = args.where as {
          key_locale_channel?: { key: string };
        };
        const key = w.key_locale_channel?.key ?? 'password_reset';
        return Promise.resolve({
          key,
          locale: 'en',
          channel: 'email',
          subject: 'Reset {{resetUrl}}',
          bodyHtml: '<p>{{resetUrl}} {{referenceNo}} {{trackUrl}}</p>',
          bodyText: '{{resetUrl}}',
        });
      },
    );
    notificationDeliveryCreate.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'ndlv_1',
        ...data,
        retries: 0,
        lastError: null,
        sentAt: null,
      }),
    );
    notificationDeliveryFindUnique.mockResolvedValue({
      id: 'ndlv_1',
      templateKey: 'password_reset',
      to: 'user@example.com',
      channel: 'email',
      status: 'queued',
      retries: 0,
      correlationId: 'corr-1',
      payload: { resetUrl: 'https://app/reset', expiresInMinutes: 60 },
    });
    notificationDeliveryUpdate.mockResolvedValue({});
    emailSend.mockResolvedValue({ messageId: 'test' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notificationTemplate: {
              upsert: notificationTemplateUpsert,
              findUnique: notificationTemplateFindUnique,
            },
            notificationDelivery: {
              create: notificationDeliveryCreate,
              findUnique: notificationDeliveryFindUnique,
              update: notificationDeliveryUpdate,
            },
          },
        },
        {
          provide: AuditService,
          useValue: { logEvent },
        },
        {
          provide: EmailProviderFactory,
          useValue: {
            getProvider: () => ({ send: emailSend }),
          },
        },
        {
          provide: getQueueToken(QUEUE_NOTIFICATION_DISPATCH),
          useValue: { add: queueAdd },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('seeds templates on module init', async () => {
    await service.onModuleInit();
    expect(notificationTemplateUpsert).toHaveBeenCalled();
  });

  it('queues email and audits', async () => {
    process.env.NODE_ENV = 'test';
    const id = await service.queueEmail('password_reset', 'user@example.com', {
      variables: { resetUrl: 'https://x', expiresInMinutes: 60 },
      correlationId: 'corr-1',
    });
    expect(id).toBe('ndlv_1');
    expect(notificationDeliveryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          templateKey: 'password_reset',
          to: 'user@example.com',
          status: 'queued',
        }),
      }),
    );
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AUDIT_EVENT.NOTIFICATION_QUEUED }),
    );
    expect(emailSend).toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AUDIT_EVENT.NOTIFICATION_SENT }),
    );
  });

  it('buildPasswordResetUrl encodes token', () => {
    process.env.APP_PUBLIC_URL = 'http://localhost:3000';
    const url = service.buildPasswordResetUrl('abc+def');
    expect(url).toContain('/auth/reset?token=');
    expect(url).toContain(encodeURIComponent('abc+def'));
  });

  it('buildPublicTrackUrl uses APP_PUBLIC_TRACK_URL_PREFIX when set', () => {
    process.env.APP_PUBLIC_TRACK_URL_PREFIX =
      'http://localhost:3001/api/v1/complaints/track';
    const url = buildPublicTrackUrl('CMS-2026-000001');
    expect(url).toBe(
      'http://localhost:3001/api/v1/complaints/track/CMS-2026-000001',
    );
    delete process.env.APP_PUBLIC_TRACK_URL_PREFIX;
  });

  it('queueComplaintSubmittedAck queues complaint_submitted_ack template', async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_PUBLIC_TRACK_URL_PREFIX =
      'http://localhost:3001/api/v1/complaints/track';
    await service.queueComplaintSubmittedAck(
      'citizen@example.com',
      'CMS-2026-000099',
      'en',
      'corr-z',
    );
    expect(notificationDeliveryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          templateKey: 'complaint_submitted_ack',
          to: 'citizen@example.com',
        }),
      }),
    );
    delete process.env.APP_PUBLIC_TRACK_URL_PREFIX;
  });

  it('resendDelivery throws when original is still queued', async () => {
    notificationDeliveryFindUnique.mockResolvedValue({
      id: 'ndlv_q',
      templateKey: 'password_reset',
      to: 'user@example.com',
      channel: 'email',
      status: 'queued',
      retries: 0,
      correlationId: 'c1',
      payload: { __locale: 'en' },
      sentAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(service.resendDelivery('ndlv_q')).rejects.toThrow(
      ConflictException,
    );
  });

  it('resendDelivery throws NotFound when id unknown', async () => {
    notificationDeliveryFindUnique.mockResolvedValue(null);
    await expect(service.resendDelivery('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
