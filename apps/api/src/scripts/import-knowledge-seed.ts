/**
 * One-time import: FAQ JSON + approved reference URLs → draft KnowledgeArticle rows.
 *
 * Usage (from apps/api):
 *   pnpm import:knowledge
 *
 * FAQ items from app JSON are published immediately (trusted source).
 * URL imports remain DRAFT for Communications review.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { ComplaintLocale, KnowledgeSourceType } from '@prisma/client';
import { createScriptPrismaClient } from './script-prisma';

const prisma = createScriptPrismaClient();

const APPROVED_URLS: Array<{
  slug: string;
  locale: ComplaintLocale;
  title: string;
  topic: string;
  url: string;
  sourceType: KnowledgeSourceType;
}> = [
  {
    slug: 'mopd-overview',
    locale: ComplaintLocale.en,
    title: 'Ministry of Planning and Development — Overview',
    topic: 'general',
    url: 'https://mopd.gov.et/en/mopd/',
    sourceType: KnowledgeSourceType.OFFICIAL,
  },
  {
    slug: 'council-of-ministers-ethiopia',
    locale: ComplaintLocale.en,
    title: 'Council of Ministers (Ethiopia)',
    topic: 'government',
    url: 'https://en.wikipedia.org/wiki/Council_of_Ministers_(Ethiopia)',
    sourceType: KnowledgeSourceType.REFERENCE,
  },
  {
    slug: 'growth-transformation-plan',
    locale: ComplaintLocale.en,
    title: 'Growth and Transformation Plan',
    topic: 'planning',
    url: 'https://en.wikipedia.org/wiki/Growth_and_Transformation_Plan',
    sourceType: KnowledgeSourceType.REFERENCE,
  },
];

const FAQ_CATEGORY_TOPIC: Record<string, string> = {
  general: 'general',
  submitting: 'submitting',
  tracking: 'tracking',
  privacy: 'privacy',
  support: 'support',
};

interface FaqFile {
  items: Record<string, { question: string; answer: string }>;
  categories: Record<string, string>;
}

function repoPath(...segments: string[]): string {
  return path.resolve(__dirname, '../../../..', ...segments);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function loadFaq(locale: ComplaintLocale): Promise<void> {
  const file = repoPath(
    'apps',
    'web',
    'messages',
    'public',
    locale === ComplaintLocale.en ? 'faq.en.json' : 'faq.am.json',
  );
  const raw = await readFile(file, 'utf8');
  const faq = JSON.parse(raw) as FaqFile;

  for (const [key, item] of Object.entries(faq.items)) {
    const slug = `faq-${slugify(key)}`;
    const topic =
      Object.entries(FAQ_CATEGORY_TOPIC).find(([cat]) =>
        key.includes(cat),
      )?.[1] ?? 'general';

    const bodyMarkdown = `## ${item.question}\n\n${item.answer}`;
    await prisma.knowledgeArticle.upsert({
      where: { slug_locale: { slug, locale } },
      create: {
        slug,
        locale,
        title: item.question,
        bodyMarkdown,
        topic,
        sourceType: KnowledgeSourceType.FAQ,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        lastReviewedAt: new Date(),
      },
      update: {
        title: item.question,
        bodyMarkdown,
        topic,
        sourceType: KnowledgeSourceType.FAQ,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        lastReviewedAt: new Date(),
      },
    });
  }
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|div|h\d|li|br)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchUrlDraft(
  entry: (typeof APPROVED_URLS)[number],
): Promise<void> {
  const response = await fetch(entry.url, {
    headers: { 'User-Agent': 'MoPD-CMS-Knowledge-Import/1.0' },
  });
  if (!response.ok) {
    console.warn(`Skip ${entry.url}: HTTP ${response.status}`);
    return;
  }
  const html = await response.text();
  const body = htmlToMarkdown(html).slice(0, 12000);
  const bodyMarkdown = `> Source: ${entry.url}\n> Imported as draft — review before publish.\n\n# ${entry.title}\n\n${body}`;

  await prisma.knowledgeArticle.upsert({
    where: { slug_locale: { slug: entry.slug, locale: entry.locale } },
    create: {
      slug: entry.slug,
      locale: entry.locale,
      title: entry.title,
      bodyMarkdown,
      topic: entry.topic,
      sourceUrl: entry.url,
      sourceType: entry.sourceType,
      status: 'DRAFT',
    },
    update: {
      title: entry.title,
      bodyMarkdown,
      topic: entry.topic,
      sourceUrl: entry.url,
      sourceType: entry.sourceType,
    },
  });
}

async function main(): Promise<void> {
  console.log('Importing FAQ articles (en + am)...');
  await loadFaq(ComplaintLocale.en);
  await loadFaq(ComplaintLocale.am);

  console.log('Fetching approved reference URLs...');
  for (const entry of APPROVED_URLS) {
    try {
      await fetchUrlDraft(entry);
      console.log(`  ✓ ${entry.slug}`);
    } catch (err) {
      console.warn(`  ✗ ${entry.slug}:`, err);
    }
  }

  const count = await prisma.knowledgeArticle.count();
  console.log(`Done. ${count} knowledge articles in database (mostly draft).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
