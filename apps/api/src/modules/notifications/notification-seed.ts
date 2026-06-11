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
    bodyText: 'ቅሬታዎን {{referenceNo}} ተቀብለናል።\nመከታተያ:\n{{trackUrl}}',
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
  {
    key: 'complaint_recovery_otp',
    locale: 'en',
    channel: 'email',
    subject: 'Your MoPD reference recovery code',
    bodyHtml: `<p>Your verification code is <strong>{{otpCode}}</strong>.</p>
<p>It expires in {{expiresInMinutes}} minutes. Do not share this code.</p>`,
    bodyText:
      'Your verification code is {{otpCode}}.\nIt expires in {{expiresInMinutes}} minutes. Do not share this code.',
  },
  {
    key: 'complaint_recovery_otp',
    locale: 'am',
    channel: 'email',
    subject: 'የማጣቀሻ መመለስ ማረጋገጫ ኮድ',
    bodyHtml: `<p>የማረጋገጫ ኮድዎ <strong>{{otpCode}}</strong> ነው።</p>
<p>በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ኮዱን ከሌላ ሰው ጋር አያጋሩ።</p>`,
    bodyText:
      'የማረጋገጫ ኮድዎ {{otpCode}} ነው።\nበ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ኮዱን ከሌላ ሰው ጋር አያጋሩ።',
  },
  {
    key: 'complaint_recovery_resolved',
    locale: 'en',
    channel: 'email',
    subject: 'Your complaint reference — {{referenceNo}}',
    bodyHtml: `<p>We located your complaint reference: <strong>{{referenceNo}}</strong>.</p>
<p><a href="{{trackUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">Track complaint status</a></p>
<p style="${URL_LINE_STYLE}">{{trackUrl}}</p>`,
    bodyText:
      'Your complaint reference: {{referenceNo}}\nTrack status:\n{{trackUrl}}',
  },
  {
    key: 'complaint_recovery_resolved',
    locale: 'am',
    channel: 'email',
    subject: 'የቅሬታ ማጣቀሻ — {{referenceNo}}',
    bodyHtml: `<p>የቅሬታዎ ማጣቀሻ ተገኝቷል፡ <strong>{{referenceNo}}</strong>።</p>
<p><a href="{{trackUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">ሁኔታ ይከታተሉ</a></p>
<p style="${URL_LINE_STYLE}">{{trackUrl}}</p>`,
    bodyText: 'የቅሬታ ማጣቀሻ፡ {{referenceNo}}\nመከታተያ፡\n{{trackUrl}}',
  },
  {
    key: 'complaint_recovery_inquiry_received',
    locale: 'en',
    channel: 'email',
    subject: 'We received your reference recovery request',
    bodyHtml: `<p>Thank you. MoPD received your manual reference recovery request.</p>
<p>Staff will review it and email you at this address when they have an outcome. This may take several business days.</p>
<p>Keep this email. If we locate your complaint, we will send your reference number here.</p>`,
    bodyText:
      'MoPD received your manual reference recovery request. Staff will email you at this address when they have an outcome (several business days). If we locate your complaint, we will send your reference number here.',
  },
  {
    key: 'complaint_recovery_inquiry_received',
    locale: 'am',
    channel: 'email',
    subject: 'የማጣቀሻ መመለስ ጥያቄዎ ተቀብለናል',
    bodyHtml: `<p>አመሰግናለሁ። የእጅ የማጣቀሻ መመለስ ጥያቄዎ ተቀብለናል።</p>
<p>ሰራተኞች ይገመግሙበታል እና ውጤት ሲኖር በዚህ ኢሜይል ይላኩልዎታል። ብዙ የስራ ቀናት ሊወስድ ይችላል።</p>
<p>ይህን ኢሜይል ይጠብቁ። ቅሬታዎ ከተገኘ ማጣቀሻዎን እዚህ እንልካለን።</p>`,
    bodyText:
      'የእጅ የማጣቀሻ መመለስ ጥያቄዎ ተቀብለናል። ውጤት ሲኖር በዚህ ኢሜይል እንላክልዎታለን። ቅሬታዎ ከተገኘ ማጣቀሻዎን እዚህ እንልካለን።',
  },
  {
    key: 'complaint_recovery_inquiry_rejected',
    locale: 'en',
    channel: 'email',
    subject: 'Reference recovery — we could not verify your complaint',
    bodyHtml: `<p>We reviewed your reference recovery request but could not verify the complaint you described.</p>
<p>You may <a href="{{newComplaintUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">submit a new complaint</a> and save your reference number. Provide your email or phone when submitting so we can reach you.</p>
<p style="${URL_LINE_STYLE}">{{newComplaintUrl}}</p>`,
    bodyText:
      'We could not verify the complaint from your recovery request.\nSubmit a new complaint and save your reference number:\n{{newComplaintUrl}}\nProvide email or phone when submitting.',
  },
  {
    key: 'complaint_recovery_inquiry_rejected',
    locale: 'am',
    channel: 'email',
    subject: 'የማጣቀሻ መመለስ — ቅሬታው አልተረጋገጠም',
    bodyHtml: `<p>ጥያቄዎን አገናኝን ቅሬታውን ማረጋገጥ አልቻልንም።</p>
<p><a href="{{newComplaintUrl}}" style="word-break:break-all;overflow-wrap:anywhere;">አዲስ ቅሬታ ማስገባት</a> ይችላሉ እና ማጣቀሻዎን ይጠብቁ። ሲሰጡ ኢሜይል ወይም ስልክ ያስገቡ።</p>
<p style="${URL_LINE_STYLE}">{{newComplaintUrl}}</p>`,
    bodyText:
      'ቅሬታው አልተረጋገጠም።\nአዲስ ቅሬታ ያስገቡ እና ማጣቀሻዎን ይጠብቁ፡\n{{newComplaintUrl}}',
  },
  {
    key: 'mfa_login_otp',
    locale: 'en',
    channel: 'email',
    subject: 'Your MoPD login code',
    bodyHtml: `<p>Your one-time login code is <strong>{{code}}</strong>.</p>
<p>Expires in {{expiresInMinutes}} minutes. Do not share this code.</p>`,
    bodyText:
      'Your one-time login code is {{code}}.\nExpires in {{expiresInMinutes}} minutes. Do not share this code.',
  },
  {
    key: 'mfa_login_otp',
    locale: 'am',
    channel: 'email',
    subject: 'የ MoPD መግቢያ ኮድ',
    bodyHtml: `<p>የአንድ ጊዜ መግቢያ ኮድዎ <strong>{{code}}</strong> ነው።</p>
<p>በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ኮዱን ከሌላ ሰው ጋር አያጋሩ።</p>`,
    bodyText:
      'የአንድ ጊዜ መግቢያ ኮድዎ {{code}} ነው።\nበ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ኮዱን ከሌላ ሰው ጋር አያጋሩ።',
  },
];
