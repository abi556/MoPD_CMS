import type { ComplaintLocale, NotificationChannel } from '@prisma/client';

export interface NotificationTemplateSeed {
  key: string;
  locale: ComplaintLocale;
  channel: NotificationChannel;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

const URL_LINE_STYLE =
  'word-break:break-all;overflow-wrap:anywhere;font-size:12px;color:#555555;';

export const NOTIFICATION_TEMPLATE_SEEDS: NotificationTemplateSeed[] = [
  {
    key: 'password_reset',
    locale: 'en',
    channel: 'email',
    subject: 'Reset your MoPD CMS password',
    bodyHtml: `<p>You requested a password reset.</p>
<p><a href="{{resetUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">Reset your password</a></p>
<p style="${URL_LINE_STYLE}">{{resetUrl}}</p>
<p>This link expires in {{expiresInMinutes}} minutes.</p>`,
    bodyText:
      'You requested a password reset.\nReset your password: {{resetUrl}}\nThis link expires in {{expiresInMinutes}} minutes.',
  },
  {
    key: 'password_reset',
    locale: 'am',
    channel: 'email',
    subject: 'የ MoPD CMS የይለፍ ቃል ዳግም ማስጀመሪያ',
    bodyHtml: `<p>የይለፍ ቃል ዳግም ማስጀመር ጠይቀዋል።</p>
<p><a href="{{resetUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">የይለፍ ቃል ያድሱ</a></p>
<p style="${URL_LINE_STYLE}">{{resetUrl}}</p>
<p>ይህ አገናኝ በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል።</p>`,
    bodyText:
      'የይለፍ ቃል ዳግም ማስጀመር ጠይቀዋል።\nየይለፍ ቃል ያድሱ: {{resetUrl}}\nይህ አገናኝ በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል።',
  },
  {
    key: 'complaint_submitted_ack',
    locale: 'en',
    channel: 'email',
    subject: 'Complaint received — {{referenceNo}}',
    bodyHtml: `<p>We received your complaint <strong>{{referenceNo}}</strong>.</p>
<p><a href="{{trackUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">Track complaint status</a></p>
<p style="${URL_LINE_STYLE}">{{trackUrl}}</p>`,
    bodyText:
      'We received your complaint {{referenceNo}}.\nTrack complaint status:\n{{trackUrl}}',
  },
  {
    key: 'complaint_submitted_ack',
    locale: 'am',
    channel: 'email',
    subject: 'ቅሬታ ተቀብለናል — {{referenceNo}}',
    bodyHtml: `<p>ቅሬታዎን <strong>{{referenceNo}}</strong> ተቀብለናል።</p>
<p><a href="{{trackUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">ቅሬታዎን ይከታተሉ</a></p>
<p style="${URL_LINE_STYLE}">{{trackUrl}}</p>`,
    bodyText:
      'ቅሬታዎን {{referenceNo}} ተቀብለናል።\nመከታተያ:\n{{trackUrl}}',
  },
  {
    key: 'complaint_transition',
    locale: 'en',
    channel: 'email',
    subject: 'Complaint {{referenceNo}} — status update',
    bodyHtml: `<p>Your complaint <strong>{{referenceNo}}</strong> is now <strong>{{status}}</strong>.</p>
<p><a href="{{trackUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">View complaint</a></p>
<p style="${URL_LINE_STYLE}">{{trackUrl}}</p>`,
    bodyText:
      'Your complaint {{referenceNo}} is now {{status}}.\nView complaint:\n{{trackUrl}}',
  },
  {
    key: 'complaint_transition',
    locale: 'am',
    channel: 'email',
    subject: 'ቅሬታ {{referenceNo}} — ሁኔታ ዝመና',
    bodyHtml: `<p>ቅሬታዎ <strong>{{referenceNo}}</strong> አሁን <strong>{{status}}</strong> ነው።</p>
<p><a href="{{trackUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">ቅሬታዎን ይመልከቱ</a></p>
<p style="${URL_LINE_STYLE}">{{trackUrl}}</p>`,
    bodyText:
      'ቅሬታዎ {{referenceNo}} አሁን {{status}} ነው።\nቅሬታዎን ይመልከቱ:\n{{trackUrl}}',
  },
];
