import type { ComplaintLocale, NotificationChannel } from '@prisma/client';

export interface LocaleTemplateContent {
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
}

export type LocaleTemplateLoader = (
  locale: ComplaintLocale,
) => Promise<LocaleTemplateContent | null>;

const LINK_STYLE =
  'word-break:break-all;overflow-wrap:anywhere;color:#0563c1;';

const EMAIL_WRAPPER_STYLE =
  'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;';

/**
 * Combines English and Amharic subjects for outbound email.
 */
export function composeBilingualSubject(
  enSubject: string,
  amSubject: string,
): string {
  const en = enSubject.trim();
  const am = amSubject.trim();
  if (en && am) {
    return `${en} / ${am}`;
  }
  return en || am;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Wraps rendered locale bodies: English first, Amharic second, with link-friendly styles.
 */
export function composeBilingualEmail(params: {
  enHtml: string;
  amHtml: string;
  enText?: string;
  amText?: string;
}): { html: string; text: string } {
  const enHtml = params.enHtml.trim();
  const amHtml = params.amHtml.trim();

  const amSection = amHtml
    ? `<hr style="border:none;border-top:1px solid #cccccc;margin:24px 0;" />
<div lang="am" style="${EMAIL_WRAPPER_STYLE}">${amHtml}</div>`
    : '';

  const html = `<div style="${EMAIL_WRAPPER_STYLE}">
<style type="text/css">a { ${LINK_STYLE} }</style>
<div lang="en">${enHtml}</div>
${amSection}
</div>`;

  const textParts: string[] = [];
  const enText = params.enText?.trim() || stripHtmlTags(enHtml);
  const amText = params.amText?.trim() || (amHtml ? stripHtmlTags(amHtml) : '');
  if (enText) {
    textParts.push(enText);
  }
  if (amText) {
    textParts.push(amText);
  }

  return { html, text: textParts.join('\n\n') };
}

/**
 * Loads en + am template rows for a notification key. English is required.
 */
export async function loadLocaleTemplates(
  load: LocaleTemplateLoader,
  onMissingAm?: () => void,
): Promise<{
  en: LocaleTemplateContent;
  am: LocaleTemplateContent | null;
}> {
  const [en, am] = await Promise.all([load('en'), load('am')]);
  if (!en) {
    throw new Error('English notification template is required');
  }
  if (!am && onMissingAm) {
    onMissingAm();
  }
  return { en, am };
}

export type TemplateFindUnique = (args: {
  where: {
    key_locale_channel: {
      key: string;
      locale: ComplaintLocale;
      channel: NotificationChannel;
    };
  };
}) => Promise<LocaleTemplateContent | null>;

export function createLocaleTemplateLoader(
  findUnique: TemplateFindUnique,
  key: string,
  channel: NotificationChannel,
): LocaleTemplateLoader {
  return (locale) =>
    findUnique({
      where: {
        key_locale_channel: {
          key,
          locale,
          channel,
        },
      },
    });
}
