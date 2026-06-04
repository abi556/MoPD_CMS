import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ComplaintLocale,
  NotificationChannel,
  NotificationDeliveryStatus,
  type NotificationDelivery,
  type NotificationTemplate,
} from '@prisma/client';
import type { Queue } from 'bullmq';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NOTIFICATION_DISPATCH } from '../../queue/queue.constants';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { NOTIFICATION_TEMPLATE_SEEDS } from './notification-seed';
import {
  composeBilingualEmail,
  composeBilingualSubject,
  createLocaleTemplateLoader,
  loadLocaleTemplates,
} from './templates/bilingual-email';
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

/** Default: notify citizens on these desk outcomes only (comma list overridable via env). */
export const DEFAULT_NOTIFY_TRANSITION_STATUSES =
  'CLOSED,RESPONSE_ISSUED,AWAITING_FEEDBACK';

export function parseNotifyTransitionStatuses(): Set<string> {
  const raw =
    process.env.NOTIFY_TRANSITION_STATUSES?.trim() ||
    DEFAULT_NOTIFY_TRANSITION_STATUSES;
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function buildPublicTrackUrl(referenceNo: string): string {
  const prefix = process.env.APP_PUBLIC_TRACK_URL_PREFIX?.replace(/\/$/, '');
  const encodedRef = encodeURIComponent(referenceNo);
  if (prefix) {
    return `${prefix}/${encodedRef}`;
  }
  return `${getAppPublicUrl()}/track/${encodedRef}`;
}

export function buildPublicComplaintNewUrl(
  locale: ComplaintLocale = 'en',
): string {
  const prefix = process.env.APP_PUBLIC_COMPLAINT_NEW_URL?.replace(/\/$/, '');
  if (prefix) {
    return prefix;
  }
  return `${getAppPublicUrl()}/${locale}/complaints/new`;
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

  async queueComplaintRecoveryOtp(
    to: string,
    otpCode: string,
    locale: ComplaintLocale,
    correlationId?: string,
  ): Promise<void> {
    await this.queueEmail('complaint_recovery_otp', to, {
      locale,
      correlationId,
      variables: {
        otpCode,
        expiresInMinutes: 10,
      },
    });
  }

  async queueComplaintSubmittedAck(
    to: string,
    referenceNo: string,
    locale: ComplaintLocale,
    correlationId?: string,
  ): Promise<void> {
    const trackUrl = buildPublicTrackUrl(referenceNo);
    await this.queueEmail('complaint_submitted_ack', to, {
      locale,
      correlationId,
      variables: { referenceNo, trackUrl },
    });
  }

  /**
   * Sends `complaint_transition` when {@link NOTIFY_TRANSITION_STATUSES} includes the target status.
   */
  async queueComplaintTransitionIfApplicable(
    to: string,
    referenceNo: string,
    toStatus: string,
    locale: ComplaintLocale,
    correlationId?: string,
  ): Promise<void> {
    const notify = parseNotifyTransitionStatuses();
    if (!notify.has(toStatus)) {
      return;
    }
    const trackUrl = buildPublicTrackUrl(referenceNo);
    await this.queueEmail('complaint_transition', to, {
      locale,
      correlationId,
      variables: { referenceNo, status: toStatus, trackUrl },
    });
  }

  async listDeliveries(params: {
    status?: NotificationDeliveryStatus;
    to?: string;
    templateKey?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    data: NotificationDelivery[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { page, pageSize, status, to: toFilter, templateKey } = params;
    const where = {
      ...(status ? { status } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(templateKey ? { templateKey } : {}),
    };
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.notificationDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notificationDelivery.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Clone a completed or failed delivery into a new queued job. Rejects if status is still `queued`.
   */
  async resendDelivery(deliveryId: string): Promise<string> {
    const orig = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!orig) {
      throw new NotFoundException('Notification delivery not found');
    }
    if (orig.status === 'queued') {
      throw new ConflictException(
        'Delivery is still queued; wait for send or failure before resending',
      );
    }
    const rawPayload = (orig.payload as Record<string, unknown> | null) ?? {};
    const localeFromPayload = rawPayload.__locale;
    const locale: ComplaintLocale =
      localeFromPayload === 'am' || localeFromPayload === 'en'
        ? localeFromPayload
        : 'en';
    const variables = { ...rawPayload } as TemplateVariables;
    delete (variables as Record<string, unknown>).__locale;

    return this.queueEmail(orig.templateKey, orig.to, {
      locale,
      correlationId: orig.correlationId ?? undefined,
      variables,
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
    const variables = { ...rawPayload } as TemplateVariables;
    delete (variables as Record<string, unknown>).__locale;

    const loadLocale = createLocaleTemplateLoader(
      (args) => this.prisma.notificationTemplate.findUnique(args),
      delivery.templateKey,
      'email',
    );

    let enTemplate;
    let amTemplate: Awaited<ReturnType<typeof loadLocaleTemplates>>['am'];
    try {
      const pair = await loadLocaleTemplates(loadLocale, () => {
        this.logger.warn(
          `Amharic template missing for ${delivery.templateKey}; sending English only in Amharic section`,
        );
      });
      enTemplate = pair.en;
      amTemplate = pair.am;
    } catch {
      await this.markFailed(
        delivery.id,
        `Template not found: ${delivery.templateKey} (en)`,
        delivery,
      );
      return;
    }

    const enSubject = renderTemplate(enTemplate.subject, variables);
    const enHtml = renderTemplate(enTemplate.bodyHtml, variables);
    const enText = enTemplate.bodyText
      ? renderTemplate(enTemplate.bodyText, variables)
      : undefined;

    const amSubject = amTemplate
      ? renderTemplate(amTemplate.subject, variables)
      : '';
    const amHtml = amTemplate
      ? renderTemplate(amTemplate.bodyHtml, variables)
      : '';
    const amText = amTemplate?.bodyText
      ? renderTemplate(amTemplate.bodyText, variables)
      : undefined;

    const subject = composeBilingualSubject(enSubject, amSubject);
    const { html, text } = composeBilingualEmail({
      enHtml,
      amHtml,
      enText,
      amText,
    });

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

  async listTemplates(params: { page: number; pageSize: number }): Promise<{
    data: NotificationTemplate[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        orderBy: [{ key: 'asc' }, { locale: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.notificationTemplate.count(),
    ]);
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  async getTemplateById(id: string) {
    const row = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Notification template not found');
    }
    return row;
  }

  async createTemplate(data: {
    key: string;
    locale: ComplaintLocale;
    channel: NotificationChannel;
    subject: string;
    bodyHtml: string;
    bodyText?: string | null;
  }) {
    try {
      return await this.prisma.notificationTemplate.create({ data });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'A template already exists for this key, locale, and channel',
        );
      }
      throw err;
    }
  }

  async updateTemplate(
    id: string,
    data: {
      subject?: string;
      bodyHtml?: string;
      bodyText?: string | null;
    },
  ) {
    await this.getTemplateById(id);
    const patch: {
      subject?: string;
      bodyHtml?: string;
      bodyText?: string | null;
    } = {};
    if (data.subject !== undefined) {
      patch.subject = data.subject;
    }
    if (data.bodyHtml !== undefined) {
      patch.bodyHtml = data.bodyHtml;
    }
    if (data.bodyText !== undefined) {
      patch.bodyText = data.bodyText;
    }
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: patch,
    });
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
