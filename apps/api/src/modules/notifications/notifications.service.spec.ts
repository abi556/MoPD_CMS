import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NOTIFICATION_DISPATCH } from '../../queue/queue.constants';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { NotificationsService } from './notifications.service';

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
    notificationTemplateFindUnique.mockResolvedValue({
      key: 'password_reset',
      locale: 'en',
      channel: 'email',
      subject: 'Reset {{resetUrl}}',
      bodyHtml: '<p>{{resetUrl}}</p>',
      bodyText: '{{resetUrl}}',
    });
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
});
