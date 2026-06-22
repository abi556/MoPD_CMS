import {
  getMoPdEmailBrandConfig,
  MOPD_EMAIL_COLORS,
  publicCmsPath,
  type MoPdEmailBrandConfig,
} from './mopd-email-brand';

const BODY_FONT =
  'font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1c1b1b;';

function renderFooterLinks(brand: MoPdEmailBrandConfig): string {
  const faqEn = publicCmsPath(brand.cmsUrl, '/en/faq');
  const privacyEn = publicCmsPath(brand.cmsUrl, '/en/privacy');
  const termsEn = publicCmsPath(brand.cmsUrl, '/en/terms');
  const contactEn = publicCmsPath(brand.cmsUrl, '/en/contact');
  const submitEn = publicCmsPath(brand.cmsUrl, '/en/complaints/new');
  const trackEn = publicCmsPath(brand.cmsUrl, '/en/track');

  const linkStyle = `color:${MOPD_EMAIL_COLORS.link};text-decoration:underline;`;

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
  <tr>
    <td style="padding:20px 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MOPD_EMAIL_COLORS.textMuted};text-align:center;border-top:1px solid ${MOPD_EMAIL_COLORS.border};">
      <p style="margin:0 0 10px;font-weight:700;color:${MOPD_EMAIL_COLORS.text};">${brand.ministryNameEn} · ${brand.ministryNameAm}</p>
      <p style="margin:0 0 12px;">
        <a href="${brand.ministryUrl}" style="${linkStyle}">mopd.gov.et</a>
        &nbsp;·&nbsp;
        <a href="${brand.cmsUrl}" style="${linkStyle}">mopdcms.gov.et</a>
      </p>
      <p style="margin:0 0 12px;">
        <a href="${submitEn}" style="${linkStyle}">Submit a complaint</a>
        &nbsp;·&nbsp;
        <a href="${trackEn}" style="${linkStyle}">Track</a>
        &nbsp;·&nbsp;
        <a href="${faqEn}" style="${linkStyle}">FAQ</a>
        &nbsp;·&nbsp;
        <a href="${contactEn}" style="${linkStyle}">Contact</a>
        &nbsp;·&nbsp;
        <a href="${privacyEn}" style="${linkStyle}">Privacy</a>
        &nbsp;·&nbsp;
        <a href="${termsEn}" style="${linkStyle}">Terms</a>
      </p>
      <p style="margin:0 0 8px;">Support: <a href="mailto:${brand.supportEmail}" style="${linkStyle}">${brand.supportEmail}</a></p>
      <p style="margin:0;font-size:11px;line-height:1.5;">Official notification from ${brand.ministryNameEn} (MoPD), Federal Democratic Republic of Ethiopia. Do not reply to this automated message. If you did not request this email, contact ${brand.supportEmail}.</p>
      <p style="margin:10px 0 0;font-size:11px;line-height:1.5;">ይህ ከ${brand.ministryNameAm} (MoPD) በኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ የተላከ ኦፊሴላዊ ማሳወቂያ ነው። ይህን ኢሜይል ካልጠየቁ ${brand.supportEmail} ያግኙን።</p>
    </td>
  </tr>
</table>`;
}

function renderLocaleSection(lang: 'en' | 'am', html: string): string {
  if (!html.trim()) {
    return '';
  }

  const label = lang === 'en' ? 'English' : 'አማርኛ';

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:4px;">
  <tr>
    <td lang="${lang}" style="padding:0 24px 20px;${BODY_FONT}">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MOPD_EMAIL_COLORS.fern};">${label}</p>
      ${html}
    </td>
  </tr>
</table>`;
}

/**
 * Wraps bilingual message bodies in a production-ready government email shell:
 * logo header, fern-green brand bar, 600px table layout, footer with public links.
 */
export function wrapGovernmentEmailDocument(params: {
  enHtml: string;
  amHtml: string;
  preheader?: string;
}): string {
  const brand = getMoPdEmailBrandConfig();
  const preheader = (params.preheader ?? '').trim();
  const enSection = renderLocaleSection('en', params.enHtml);
  const amSection = renderLocaleSection('am', params.amHtml);
  const divider = amSection
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0 24px;"><hr style="border:none;border-top:1px solid ${MOPD_EMAIL_COLORS.border};margin:0;" /></td></tr></table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${brand.cmsNameEn}</title>
</head>
<body style="margin:0;padding:0;background-color:${MOPD_EMAIL_COLORS.fernLight};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}</div>` : ''}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${MOPD_EMAIL_COLORS.fernLight};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:${MOPD_EMAIL_COLORS.surface};border:1px solid ${MOPD_EMAIL_COLORS.border};border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:${MOPD_EMAIL_COLORS.fern};padding:20px 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="64" valign="middle" style="padding-right:16px;">
                  <img src="${brand.logoUrl}" width="56" height="56" alt="MoPD logo" style="display:block;border:0;outline:none;text-decoration:none;border-radius:4px;background:#ffffff;padding:4px;" />
                </td>
                <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
                  <p style="margin:0;font-size:13px;font-weight:700;line-height:1.3;opacity:0.95;">${brand.ministryNameEn}</p>
                  <p style="margin:4px 0 0;font-size:12px;line-height:1.3;opacity:0.9;">${brand.ministryNameAm}</p>
                  <p style="margin:8px 0 0;font-size:11px;line-height:1.3;opacity:0.85;">${brand.cmsNameEn}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 0 8px;">
            ${enSection}
            ${divider}
            ${amSection}
            ${renderFooterLinks(brand)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function appendGovernmentEmailTextFooter(text: string): string {
  const brand = getMoPdEmailBrandConfig();
  const footer = [
    '—',
    brand.ministryNameEn,
    brand.ministryNameAm,
    `Ministry website: ${brand.ministryUrl}`,
    `Complaint portal: ${brand.cmsUrl}`,
    `Support: ${brand.supportEmail}`,
    `FAQ: ${publicCmsPath(brand.cmsUrl, '/en/faq')}`,
    `Privacy: ${publicCmsPath(brand.cmsUrl, '/en/privacy')}`,
    `Terms: ${publicCmsPath(brand.cmsUrl, '/en/terms')}`,
    `Official notification from ${brand.ministryNameEn} (MoPD) — do not reply to this automated message.`,
  ].join('\n');

  return text.trim() ? `${text.trim()}\n\n${footer}` : footer;
}
