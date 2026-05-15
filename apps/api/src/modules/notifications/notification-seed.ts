import type { ComplaintLocale, NotificationChannel } from '@prisma/client';

export interface NotificationTemplateSeed {
  key: string;
  locale: ComplaintLocale;
  channel: NotificationChannel;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export const NOTIFICATION_TEMPLATE_SEEDS: NotificationTemplateSeed[] = [
  {
    key: 'password_reset',
    locale: 'en',
    channel: 'email',
    subject: 'Reset your MoPD CMS password',
    bodyHtml:
      '<p>You requested a password reset.</p><p><a href="{{resetUrl}}">Reset your password</a></p><p>This link expires in {{expiresInMinutes}} minutes.</p>',
    bodyText:
      'Reset your password: {{resetUrl}} (expires in {{expiresInMinutes}} minutes)',
  },
  {
    key: 'complaint_submitted_ack',
    locale: 'en',
    channel: 'email',
    subject: 'Complaint received — {{referenceNo}}',
    bodyHtml:
      '<p>We received your complaint <strong>{{referenceNo}}</strong>.</p><p>Track status at {{trackUrl}}</p>',
    bodyText: 'Complaint {{referenceNo}} received. Track: {{trackUrl}}',
  },
  {
    key: 'complaint_transition',
    locale: 'en',
    channel: 'email',
    subject: 'Complaint {{referenceNo}} — status update',
    bodyHtml:
      '<p>Your complaint <strong>{{referenceNo}}</strong> is now <strong>{{status}}</strong>.</p>',
    bodyText: 'Complaint {{referenceNo}} status: {{status}}',
  },
];
