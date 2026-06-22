import { Injectable } from '@nestjs/common';
import { ComplaintLocale } from '@prisma/client';

export interface OrientationSource {
  title: string;
  slug: string;
  url?: string;
}

export type OrientationIntent =
  | 'identity'
  | 'about_mopd'
  | 'office_hours'
  | null;

export interface OrientationReply {
  intent: OrientationIntent;
  reply: string;
  sources: OrientationSource[];
}

const IDENTITY_PATTERNS: RegExp[] = [
  /^who are you\b/i,
  /^what are you\b/i,
  /^who is melhiq\b/i,
  /^what is melhiq\b/i,
  /^what can you (do|help)/i,
  /^(hi|hello|hey)\b/i,
  /^(ማን ነህ|ማን ነሽ|እንዴት ልረዳህ)/u,
];

const ABOUT_MOPD_PATTERNS: RegExp[] = [
  /\b(tell me about|what is|about)\b.*\b(mopd|ministry|planning and development)\b/i,
  /\b(mopd|ministry)\b.*\b(what|about|do)\b/i,
  /\b(ስለ\s*ሚኒስትሪው|ማዕድ|mopd)\b/u,
];

const OFFICE_HOURS_PATTERNS: RegExp[] = [
  /\b(office hours?|working hours?|when.*open|opening hours?)\b/i,
  /\b(ስራ\s*ሰዓት|መቼ\s*ከፍተው)\b/u,
];

@Injectable()
export class ChatbotOrientationService {
  matchIntent(message: string): OrientationIntent {
    const normalized = message.trim();
    if (!normalized) {
      return null;
    }
    if (IDENTITY_PATTERNS.some((p) => p.test(normalized))) {
      return 'identity';
    }
    if (OFFICE_HOURS_PATTERNS.some((p) => p.test(normalized))) {
      return 'office_hours';
    }
    if (ABOUT_MOPD_PATTERNS.some((p) => p.test(normalized))) {
      return 'about_mopd';
    }
    return null;
  }

  buildReply(
    intent: OrientationIntent,
    locale: ComplaintLocale,
  ): OrientationReply | null {
    if (!intent) {
      return null;
    }

    const faqSource: OrientationSource = {
      title: locale === 'am' ? 'ተደጋጋሚ ጥያቄዎች' : 'FAQ',
      slug: 'faq',
      url: undefined,
    };

    const contactSource: OrientationSource = {
      title: locale === 'am' ? 'አግኙን' : 'Contact us',
      slug: 'contact',
      url: undefined,
    };

    if (intent === 'identity') {
      return {
        intent,
        reply:
          locale === 'am'
            ? 'እኔ መልህቅ (Melhiq) ነኝ — የሚኒስትሪው የህዝብ ቅሬታ መመሪያ ረዳት። ቅሬታ ማስገባት፣ ማጣቀሻ መከታተል፣ ተደጋጋሚ ጥያቄዎች እና ተዛማጅ የMoPD አገልግሎት መረጃ ላይ እረዳለሁ። ኦፊሴላዊ ውሳኔዎችን አልሰጥም።'
            : "I'm Melhiq (መልህቅ) — the MoPD public orientation assistant. I help with submitting complaints, tracking references, FAQs, and related ministry information. I provide guidance only, not official case decisions.",
        sources: [faqSource],
      };
    }

    if (intent === 'about_mopd') {
      return {
        intent,
        reply:
          locale === 'am'
            ? 'የእቅድና ልማት ሚኒስትሪ (MoPD) የኢትዮጵያ የብሔራዊ እቅድ እና ልማት ፖሊሲዎችን የሚመራ ተቋም ነው። ይህ መድረክ ቅሬታዎን ለመላክ፣ ለመከታተል እና የህዝብ መረጃ ለማግኘት ያገለግላል። ዝርዝር ለመጠየቅ የተደጋጋሚ ጥያቄዎችን ይመልከቱ ወይም mopd.gov.et ይጎብኙ።'
            : 'The Ministry of Planning and Development (MoPD) leads national planning and development policy in Ethiopia. This portal helps you submit and track complaints and find public orientation information. For details, see our FAQ or visit mopd.gov.et.',
        sources: [
          faqSource,
          {
            title: 'MoPD overview',
            slug: 'mopd-overview',
            url: 'https://mopd.gov.et/en/mopd/',
          },
        ],
      };
    }

    return {
      intent: 'office_hours',
      reply:
        locale === 'am'
          ? 'የተወሰነ የሥራ ሰዓት በዚህ ቻትቦት ውስጥ አልተዘረዘረም። ኦፊሴላዊ ስራ ሰዓት፣ ስልክ እና ኢሜይል ለማግኘት የእውቂያ ገጻችንን ይጎብኙ። ለቅሬታ ተዛማጅ ድጋፍ support@mopd.gov.et ይጠቀሙ።'
          : 'Specific office hours are not listed in this chatbot. For official opening hours, phone numbers, and email, please visit our Contact page. For complaint-related support, email support@mopd.gov.et.',
      sources: [contactSource, faqSource],
    };
  }
}
