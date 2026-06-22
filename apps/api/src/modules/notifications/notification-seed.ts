import type { ComplaintLocale, NotificationChannel } from '@prisma/client';
import {
  emailInlineLink,
  emailMutedUrlLine,
  emailOtpBox,
  emailPrimaryButton,
  emailReferenceBadge,
  emailSecurityNote,
} from './templates/email-content-snippets';

export interface NotificationTemplateSeed {
  key: string;
  locale: ComplaintLocale;
  channel: NotificationChannel;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

const P =
  'margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1c1b1b;';

export const NOTIFICATION_TEMPLATE_SEEDS: NotificationTemplateSeed[] = [
  {
    key: 'password_reset',
    locale: 'en',
    channel: 'email',
    subject: 'Reset your MoPD CMS password',
    bodyHtml: `<p style="${P}">You requested a password reset for your MoPD CMS staff account.</p>
<p style="${P}">Use the button below to choose a new password. For your security, this link works only once and expires soon.</p>
${emailPrimaryButton('{{resetUrl}}', 'Reset password')}
${emailMutedUrlLine('{{resetUrl}}')}
${emailSecurityNote('This link expires in {{expiresInMinutes}} minutes. If you did not request a reset, ignore this email and contact support@mopd.gov.et.')}
<p style="${P}">For public complaint services, visit <a href="https://mopdcms.gov.et" style="color:#3a6b35;">mopdcms.gov.et</a> or the ministry site at <a href="https://mopd.gov.et" style="color:#3a6b35;">mopd.gov.et</a>.</p>`,
    bodyText:
      'You requested a password reset for your MoPD CMS staff account.\nReset password: {{resetUrl}}\nExpires in {{expiresInMinutes}} minutes.\nIf you did not request this, contact support@mopd.gov.et.',
  },
  {
    key: 'password_reset',
    locale: 'am',
    channel: 'email',
    subject: 'የ MoPD CMS የይለፍ ቃል ዳግም ማስጀመሪያ',
    bodyHtml: `<p style="${P}">ለ MoPD CMS የሰራተኛ መለያዎ የይለፍ ቃል ዳግም ማስጀመር ጠይቀዋል።</p>
<p style="${P}">አዲስ የይለፍ ቃል ለመምረጥ ከታች ያለውን ቁልፍ ይጠቀሙ። ለደህንነትዎ አገናኙ አንድ ጊዜ ብቻ ይሠራል እና በቅርብ ጊዜ ያበቃል።</p>
${emailPrimaryButton('{{resetUrl}}', 'የይለፍ ቃል ያድሱ')}
${emailMutedUrlLine('{{resetUrl}}')}
${emailSecurityNote('ይህ አገናኝ በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ካልጠየቁ support@mopd.gov.et ያግኙን።')}
<p style="${P}">የህዝብ ቅሬታ አገልግሎት ለ <a href="https://mopdcms.gov.et" style="color:#3a6b35;">mopdcms.gov.et</a> ወይም <a href="https://mopd.gov.et" style="color:#3a6b35;">mopd.gov.et</a> ይጎብኙ።</p>`,
    bodyText:
      'ለ MoPD CMS መለያዎ የይለፍ ቃል ዳግም ማስጀመር ጠይቀዋል።\nየይለፍ ቃል ያድሱ: {{resetUrl}}\nበ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል።',
  },
  {
    key: 'complaint_submitted_ack',
    locale: 'en',
    channel: 'email',
    subject: 'Complaint received — {{referenceNo}}',
    bodyHtml: `<p style="${P}">Thank you for contacting the Ministry of Planning and Development. We have received your complaint and registered it in our secure system.</p>
${emailReferenceBadge('{{referenceNo}}')}
<p style="${P}">Please save this reference number. You will need it to track progress, respond to requests for information, or follow up with our team.</p>
${emailPrimaryButton('{{trackUrl}}', 'Track complaint status')}
${emailMutedUrlLine('{{trackUrl}}')}
<p style="${P}">You can also submit another complaint or read guidance at ${emailInlineLink('https://mopdcms.gov.et/en/faq', 'mopdcms.gov.et/faq')}.</p>`,
    bodyText:
      'Thank you. We received your complaint.\nReference: {{referenceNo}}\nTrack status: {{trackUrl}}\nSave this reference number for follow-up.',
  },
  {
    key: 'complaint_submitted_ack',
    locale: 'am',
    channel: 'email',
    subject: 'ቅሬታ ተቀብለናል — {{referenceNo}}',
    bodyHtml: `<p style="${P}">የእቅድና ልማት ሚኒስትሪን ስለተገናኙ እናመሰግናለን። ቅሬታዎን ተቀብለን በደህንነቱ የተጠበቀ ስርዓታችን ውስጥ መዝግበናል።</p>
${emailReferenceBadge('{{referenceNo}}')}
<p style="${P}">እባክዎ ይህን ማጣቀሻ ቁጥር ይጠብቁ። ሂደቱን ለመከታተል ወይም ከቡድናችን ጋር ለመገናኘት ያስፈልጋል።</p>
${emailPrimaryButton('{{trackUrl}}', 'ቅሬታዎን ይከታተሉ')}
${emailMutedUrlLine('{{trackUrl}}')}
<p style="${P}">ተጨማሪ መረጃ በ ${emailInlineLink('https://mopdcms.gov.et/am/faq', 'mopdcms.gov.et/am/faq')} ይገኛል።</p>`,
    bodyText: 'ቅሬታዎን ተቀብለናል።\nማጣቀሻ: {{referenceNo}}\nመከታተያ: {{trackUrl}}',
  },
  {
    key: 'complaint_transition',
    locale: 'en',
    channel: 'email',
    subject: 'Complaint {{referenceNo}} — status update',
    bodyHtml: `<p style="${P}">There is an update on your complaint with the Ministry of Planning and Development.</p>
${emailReferenceBadge('{{referenceNo}}')}
<p style="${P}">Current status: <strong>{{status}}</strong></p>
<p style="${P}">Sign in to the tracking page for full details, messages from our team, and any actions required from you.</p>
${emailPrimaryButton('{{trackUrl}}', 'View complaint details')}
${emailMutedUrlLine('{{trackUrl}}')}`,
    bodyText:
      'Complaint {{referenceNo}} status update.\nCurrent status: {{status}}\nView details: {{trackUrl}}',
  },
  {
    key: 'complaint_transition',
    locale: 'am',
    channel: 'email',
    subject: 'ቅሬታ {{referenceNo}} — ሁኔታ ዝመና',
    bodyHtml: `<p style="${P}">በቅሬታዎ ላይ ዝመና አለ።</p>
${emailReferenceBadge('{{referenceNo}}')}
<p style="${P}">አሁን ያለው ሁኔታ፡ <strong>{{status}}</strong></p>
<p style="${P}">ሙሉ ዝርዝር፣ ከቡድናችን መልዕክቶች እና ከእርስዎ የሚፈለጉ ተግባራትን በመከታተያ ገጽ ይመልከቱ።</p>
${emailPrimaryButton('{{trackUrl}}', 'ቅሬታዎን ይመልከቱ')}
${emailMutedUrlLine('{{trackUrl}}')}`,
    bodyText:
      'ቅሬታ {{referenceNo}} ሁኔታ ዝመና።\nሁኔታ: {{status}}\nዝርዝር: {{trackUrl}}',
  },
  {
    key: 'complaint_recovery_otp',
    locale: 'en',
    channel: 'email',
    subject: 'Your MoPD reference recovery code',
    bodyHtml: `<p style="${P}">Use this verification code to recover your complaint reference number on MoPD CMS.</p>
${emailOtpBox('{{otpCode}}')}
${emailSecurityNote('Expires in {{expiresInMinutes}} minutes. Never share this code with anyone — MoPD staff will never ask for it by phone or email.')}
<p style="${P}">If you did not start a recovery request, you can safely ignore this message.</p>`,
    bodyText:
      'Your verification code: {{otpCode}}\nExpires in {{expiresInMinutes}} minutes. Do not share this code.',
  },
  {
    key: 'complaint_recovery_otp',
    locale: 'am',
    channel: 'email',
    subject: 'የማጣቀሻ መመለስ ማረጋገጫ ኮድ',
    bodyHtml: `<p style="${P}">በ MoPD CMS ላይ የቅሬታ ማጣቀሻዎን ለመመለስ ይህን ኮድ ይጠቀሙ።</p>
${emailOtpBox('{{otpCode}}')}
${emailSecurityNote('በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ኮዱን ከማንም ጋር አያጋሩ — ሰራተኞች በስልክ ወይም በኢሜይል አይጠይቁትም።')}
<p style="${P}">የመመለስ ጥያቄ ካልጀመሩ ይህን መልዕክት ችላ ብለው ይተውት።</p>`,
    bodyText: 'የማረጋገጫ ኮድ: {{otpCode}}\nበ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል።',
  },
  {
    key: 'complaint_recovery_resolved',
    locale: 'en',
    channel: 'email',
    subject: 'Your complaint reference — {{referenceNo}}',
    bodyHtml: `<p style="${P}">We located the complaint associated with your recovery request.</p>
${emailReferenceBadge('{{referenceNo}}')}
<p style="${P}">Use the link below to track status and view updates from MoPD.</p>
${emailPrimaryButton('{{trackUrl}}', 'Track complaint status')}
${emailMutedUrlLine('{{trackUrl}}')}`,
    bodyText:
      'Your complaint reference: {{referenceNo}}\nTrack status: {{trackUrl}}',
  },
  {
    key: 'complaint_recovery_resolved',
    locale: 'am',
    channel: 'email',
    subject: 'የቅሬታ ማጣቀሻ — {{referenceNo}}',
    bodyHtml: `<p style="${P}">ከመመለስ ጥያቄዎ ጋር የተያያዘው ቅሬታ ተገኝቷል።</p>
${emailReferenceBadge('{{referenceNo}}')}
<p style="${P}">ሁኔታውን ለመከታተል እና ዝመናዎችን ለማየት ከታች ያለውን አገናኝ ይጠቀሙ።</p>
${emailPrimaryButton('{{trackUrl}}', 'ሁኔታ ይከታተሉ')}
${emailMutedUrlLine('{{trackUrl}}')}`,
    bodyText: 'የቅሬታ ማጣቀሻ: {{referenceNo}}\nመከታተያ: {{trackUrl}}',
  },
  {
    key: 'complaint_recovery_inquiry_received',
    locale: 'en',
    channel: 'email',
    subject: 'We received your reference recovery request',
    bodyHtml: `<p style="${P}">Thank you. The Ministry of Planning and Development received your manual reference recovery request.</p>
<p style="${P}">A staff member will review the details you provided and email you at this address when there is an outcome. This may take several business days.</p>
<p style="${P}">Please keep this email. If we locate your complaint, we will send your reference number here.</p>
<p style="${P}">Meanwhile you may ${emailInlineLink('https://mopdcms.gov.et/en/contact', 'contact MoPD')} or read the ${emailInlineLink('https://mopdcms.gov.et/en/faq', 'FAQ')}.</p>`,
    bodyText:
      'We received your manual reference recovery request. Staff will email you when there is an outcome (several business days). Keep this email.',
  },
  {
    key: 'complaint_recovery_inquiry_received',
    locale: 'am',
    channel: 'email',
    subject: 'የማጣቀሻ መመለስ ጥያቄዎ ተቀብለናል',
    bodyHtml: `<p style="${P}">አመሰግናለሁ። የእጅ የማጣቀሻ መመለስ ጥያቄዎ ተቀብለናል።</p>
<p style="${P}">ሰራተኞች ይገመግሙበታል እና ውጤት ሲኖር በዚህ ኢሜይል ይላኩልዎታል። ብዙ የስራ ቀናት ሊወስድ ይችላል።</p>
<p style="${P}">ይህን ኢሜይል ይጠብቁ። ቅሬታዎ ከተገኘ ማጣቀሻዎን እዚህ እንልካለን።</p>`,
    bodyText: 'የእጅ የማጣቀሻ መመለስ ጥያቄዎ ተቀብለናል። ውጤት ሲኖር በዚህ ኢሜይል እንላክልዎታለን።',
  },
  {
    key: 'complaint_recovery_inquiry_rejected',
    locale: 'en',
    channel: 'email',
    subject: 'Reference recovery — we could not verify your complaint',
    bodyHtml: `<p style="${P}">We reviewed your reference recovery request but could not verify the complaint you described with the information available.</p>
<p style="${P}">You may submit a new complaint and save the reference number we provide. Include your email or phone so we can reach you.</p>
${emailPrimaryButton('{{newComplaintUrl}}', 'Submit a new complaint')}
${emailMutedUrlLine('{{newComplaintUrl}}')}
<p style="${P}">Questions? Visit ${emailInlineLink('https://mopdcms.gov.et/en/contact', 'mopdcms.gov.et/contact')} or email support@mopd.gov.et.</p>`,
    bodyText:
      'We could not verify your recovery request.\nSubmit a new complaint: {{newComplaintUrl}}',
  },
  {
    key: 'complaint_recovery_inquiry_rejected',
    locale: 'am',
    channel: 'email',
    subject: 'የማጣቀሻ መመለስ — ቅሬታው አልተረጋገጠም',
    bodyHtml: `<p style="${P}">ጥያቄዎን አገናኝን ቅሬታውን በእጅ የቀረበው መረጃ ማረጋገጥ አልቻልንም።</p>
<p style="${P}">አዲስ ቅሬታ ማስገባት ይችላሉ። ኢሜይል ወይም ስልክ ያስገቡ።</p>
${emailPrimaryButton('{{newComplaintUrl}}', 'አዲስ ቅሬታ ማስገባት')}
${emailMutedUrlLine('{{newComplaintUrl}}')}`,
    bodyText: 'ቅሬታው አልተረጋገጠም።\nአዲስ ቅሬታ: {{newComplaintUrl}}',
  },
  {
    key: 'mfa_login_otp',
    locale: 'en',
    channel: 'email',
    subject: 'Your MoPD login code',
    bodyHtml: `<p style="${P}">Use this one-time code to complete sign-in to MoPD CMS.</p>
${emailOtpBox('{{code}}')}
${emailSecurityNote('Expires in {{expiresInMinutes}} minutes. Do not share this code. MoPD will never ask for it in a phone call.')}
<p style="${P}">If you did not try to sign in, secure your account and contact support@mopd.gov.et immediately.</p>`,
    bodyText:
      'Your one-time login code: {{code}}\nExpires in {{expiresInMinutes}} minutes. Do not share this code.',
  },
  {
    key: 'mfa_login_otp',
    locale: 'am',
    channel: 'email',
    subject: 'የ MoPD መግቢያ ኮድ',
    bodyHtml: `<p style="${P}">ወደ MoPD CMS ለመግባት ይህን አንድ ጊዜ ኮድ ይጠቀሙ።</p>
${emailOtpBox('{{code}}')}
${emailSecurityNote('በ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል። ኮዱን አያጋሩ። MoPD በስልክ አይጠይቅም።')}
<p style="${P}">መግባት ካልሞከሩ መለያዎን ያስተካክሉ እና support@mopd.gov.et ያግኙ።</p>`,
    bodyText:
      'የአንድ ጊዜ መግቢያ ኮድ: {{code}}\nበ {{expiresInMinutes}} ደቂቃዎች ውስጥ ያበቃል።',
  },
];
