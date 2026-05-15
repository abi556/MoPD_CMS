import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ComplaintLocale, NotificationChannel } from '@prisma/client';
import type { Queue } from 'bullmq';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NOTIFICATION_DISPATCH } from '../../queue/queue.constants';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { NOTIFICATION_TEMPLATE_SEEDS } from './notification-seed';
import {
  renderTemplate,
  type TemplateVariables,
} from './templates/template-renderer';

export const NOTIFICATION_DISPATCH_JOB = 'dispatch';

export interface QueueEmailOptions {
  locale?: ComplaintLocale;
  correlationId?: string;
  variables: TemplateVariables;
}

function getAppPublicUrl(): string {
  const base = process.env.APP_PUBLIC_URL ?? 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

function getPasswordResetTtlMinutes(): number {
  const raw = process.env.AUTH_PASSWORD_RESET_TOKEN_TTL_MS;
  const ms = raw ? Number.parseInt(raw, 10) : 3_600_000;
  return Math.max(1, Math.round(ms / 60_000));
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly syncInTest =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailProviderFactory: EmailProviderFactory,
    @InjectQueue(QUEUE_NOTIFICATION_DISPATCH)
    private readonly dispatchQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeedTemplates();
  }

  async ensureSeedTemplates(): Promise<void> {
    for (const seed of NOTIFICATION_TEMPLATE_SEEDS) {
      await this.prisma.notificationTemplate.upsert({
        where: {
          key_locale_channel: {
            key: seed.key,
            locale: seed.locale,
            channel: seed.channel,
          },
        },
        create: {
          key: seed.key,
          locale: seed.locale,
          channel: seed.channel,
          subject: seed.subject,
          bodyHtml: seed.bodyHtml,
          bodyText: seed.bodyText,
        },
        update: {
          subject: seed.subject,
          bodyHtml: seed.bodyHtml,
          bodyText: seed.bodyText,
        },
      });
    }
  }

  buildPasswordResetUrl(tokenPlain: string): string {
    return `${getAppPublicUrl()}/auth/reset?token=${encodeURIComponent(tokenPlain)}`;
  }

  async queueEmail(
    templateKey: string,
    to: string,
    options: QueueEmailOptions,
  ): Promise<string> {
    const locale = options.locale ?? 'en';
    const channel: NotificationChannel = 'email';

    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        templateKey,
        to,
        channel,
        status: 'queued',
        correlationId: options.correlationId,
        payload: { ...options.variables, __locale: locale },
      },
    });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.NOTIFICATION_QUEUED,
      correlationId: options.correlationId,
      entityType: 'notification_delivery',
      entityId: delivery.id,
      metadata: { templateKey, to, channel },
    });

    if (this.syncInTest) {
      await this.processDelivery(delivery.id);
      return delivery.id;
    }

    await this.dispatchQueue.add(
      NOTIFICATION_DISPATCH_JOB,
      { deliveryId: delivery.id },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return delivery.id;
  }

  async queuePasswordResetEmail(
    email: string,
    tokenPlain: string,
    correlationId?: string,
  ): Promise<void> {
    const resetUrl = this.buildPasswordResetUrl(tokenPlain);
    await this.queueEmail('password_reset', email, {
      locale: 'en',
      correlationId,
      variables: {
        resetUrl,
        expiresInMinutes: getPasswordResetTtlMinutes(),
      },
    });
  }

  async processDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery || delivery.status === 'sent') {
      return;
    }

    if (delivery.channel !== 'email') {
      await this.markFailed(delivery.id, 'Unsupported channel', delivery);
      return;
    }

    const rawPayload =
      (delivery.payload as Record<string, unknown> | null) ?? {};
    const localeFromPayload = rawPayload.__locale;
    const templateLocale: ComplaintLocale =
      localeFromPayload === 'am' || localeFromPayload === 'en'
        ? localeFromPayload
        : 'en';
    const variables = { ...rawPayload } as TemplateVariables;
    delete (variables as Record<string, unknown>).__locale;

    const template = await this.prisma.notificationTemplate.findUnique({
      where: {
        key_locale_channel: {
          key: delivery.templateKey,
          locale: templateLocale,
          channel: 'email',
        },
      },
    });

    if (!template) {
      await this.markFailed(
        delivery.id,
        `Template not found: ${delivery.templateKey}`,
        delivery,
      );
      return;
    }

    const subject = renderTemplate(template.subject, variables);
    const html = renderTemplate(template.bodyHtml, variables);
    const text = template.bodyText
      ? renderTemplate(template.bodyText, variables)
      : undefined;

    try {
      const provider = this.emailProviderFactory.getProvider();
      await provider.send({ to: delivery.to, subject, html, text });

      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          lastError: null,
        },
      });

      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.NOTIFICATION_SENT,
        correlationId: delivery.correlationId ?? undefined,
        entityType: 'notification_delivery',
        entityId: delivery.id,
        metadata: { templateKey: delivery.templateKey, to: delivery.to },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Notification delivery ${deliveryId} failed: ${message}`,
      );
      const retries = delivery.retries + 1;
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: retries >= 5 ? 'failed' : 'queued',
          retries,
          lastError: message,
        },
      });
      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.NOTIFICATION_FAILED,
        correlationId: delivery.correlationId ?? undefined,
        entityType: 'notification_delivery',
        entityId: delivery.id,
        metadata: { error: message, retries },
      });
      throw err;
    }
  }

  private async markFailed(
    id: string,
    message: string,
    delivery: { correlationId: string | null; templateKey: string; to: string },
  ): Promise<void> {
    await this.prisma.notificationDelivery.update({
      where: { id },
      data: { status: 'failed', lastError: message },
    });
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.NOTIFICATION_FAILED,
      correlationId: delivery.correlationId ?? undefined,
      entityType: 'notification_delivery',
      entityId: id,
      metadata: { error: message },
    });
  }
}
