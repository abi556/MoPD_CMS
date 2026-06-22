import { MOPD_EMAIL_COLORS } from './mopd-email-brand';

const { fern, fernLight, text, textMuted, link } = MOPD_EMAIL_COLORS;

/** Primary CTA — table-based for Outlook compatibility. */
export function emailPrimaryButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
  <tr>
    <td align="center" style="border-radius:6px;background-color:${fern};">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;line-height:1.25;">${label}</a>
    </td>
  </tr>
</table>`;
}

export function emailReferenceBadge(referenceNo: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
  <tr>
    <td style="padding:14px 16px;background-color:${fernLight};border-left:4px solid ${fern};font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${text};letter-spacing:0.4px;">
      ${referenceNo}
    </td>
  </tr>
</table>`;
}

export function emailOtpBox(code: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
  <tr>
    <td align="center" style="padding:18px 16px;background-color:${fernLight};border-radius:8px;font-family:Consolas,Monaco,'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:8px;color:${fern};">
      ${code}
    </td>
  </tr>
</table>`;
}

export function emailMutedUrlLine(url: string): string {
  return `<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${textMuted};word-break:break-all;overflow-wrap:anywhere;">${url}</p>`;
}

export function emailSecurityNote(textLine: string): string {
  return `<p style="margin:16px 0 0;padding:12px 14px;background-color:#fff8e6;border-left:4px solid #d4a017;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${text};">${textLine}</p>`;
}

export function emailInlineLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${link};font-weight:600;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${label}</a>`;
}
