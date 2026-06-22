import type { ComplaintLocale, NotificationChannel } from '@prisma/client';
import {
  appendGovernmentEmailTextFooter,
  wrapGovernmentEmailDocument,
} from './government-email-layout';

export interface LocaleTemplateContent {
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
}

export type LocaleTemplateLoader = (
  locale: ComplaintLocale,
) => Promise<LocaleTemplateContent | null>;

const LINK_STYLE =
  'color:#3a6b35;font-weight:600;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;';

/** @internal exported for template seeds that need link styling in rare inline cases */
export const EMAIL_LINK_STYLE = LINK_STYLE;

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

/**
 * Wraps rendered locale bodies in the MoPD government email shell (logo, fern green, footer links).
 */
export function composeBilingualEmail(params: {
  enHtml: string;
  amHtml: string;
  enText?: string;
  amText?: string;
  preheader?: string;
}): { html: string; text: string } {
  const enHtml = params.enHtml.trim();
  const amHtml = params.amHtml.trim();

  const html = wrapGovernmentEmailDocument({
    enHtml,
    amHtml,
    preheader:
      params.preheader ??
      (stripHtmlTags(enHtml).slice(0, 140) ||
        'Official message from the Ministry of Planning and Development'),
  });

  const textParts: string[] = [];
  const enText = params.enText?.trim() || stripHtmlTags(enHtml);
  const amText = params.amText?.trim() || (amHtml ? stripHtmlTags(amHtml) : '');
  if (enText) {
    textParts.push(enText);
  }
  if (amText) {
    textParts.push(amText);
  }

  return {
    html,
    text: appendGovernmentEmailTextFooter(textParts.join('\n\n')),
  };
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
