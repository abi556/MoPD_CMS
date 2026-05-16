import { NOTIFICATION_TEMPLATE_SEEDS } from '../notification-seed';
import { renderTemplate } from './template-renderer';
import {
  composeBilingualEmail,
  composeBilingualSubject,
  loadLocaleTemplates,
} from './bilingual-email';

describe('composeBilingualSubject', () => {
  it('joins en and am with slash', () => {
    expect(
      composeBilingualSubject(
        'Complaint received — CMS-1',
        'ቅሬታ ተቀብለናል — CMS-1',
      ),
    ).toBe('Complaint received — CMS-1 / ቅሬታ ተቀብለናል — CMS-1');
  });

  it('returns only en when am is empty', () => {
    expect(composeBilingualSubject('English only', '')).toBe('English only');
  });

  it('returns only am when en is empty', () => {
    expect(composeBilingualSubject('', 'Amharic only')).toBe('Amharic only');
  });
});

describe('composeBilingualEmail', () => {
  it('places English before Amharic with lang attributes', () => {
    const { html, text } = composeBilingualEmail({
      enHtml: '<p>Hello EN</p>',
      amHtml: '<p>ሰላም AM</p>',
      enText: 'Hello EN',
      amText: 'ሰላም AM',
    });

    const enIndex = html.indexOf('lang="en"');
    const amIndex = html.indexOf('lang="am"');
    expect(enIndex).toBeGreaterThan(-1);
    expect(amIndex).toBeGreaterThan(enIndex);
    expect(html).toContain('Hello EN');
    expect(html).toContain('ሰላም AM');
    expect(html).toContain('word-break:break-all');
    expect(text).toBe('Hello EN\n\nሰላም AM');
  });

  it('omits Amharic section when amHtml is empty', () => {
    const { html } = composeBilingualEmail({
      enHtml: '<p>Only EN</p>',
      amHtml: '',
    });
    expect(html).not.toContain('lang="am"');
    expect(html).not.toContain('<hr');
  });

  it('strips HTML for text fallback when bodyText missing', () => {
    const { text } = composeBilingualEmail({
      enHtml: '<p>Line one</p>',
      amHtml: '<p>ሰላም</p>',
    });
    expect(text).toContain('Line one');
    expect(text).toContain('ሰላም');
  });
});

describe('seed templates integration', () => {
  it('complaint_submitted_ack renders tappable bilingual track links', () => {
    const trackUrl = 'http://localhost:3000/track/CMS-2026-000006';
    const vars = { referenceNo: 'CMS-2026-000006', trackUrl };
    const en = NOTIFICATION_TEMPLATE_SEEDS.find(
      (s) => s.key === 'complaint_submitted_ack' && s.locale === 'en',
    )!;
    const am = NOTIFICATION_TEMPLATE_SEEDS.find(
      (s) => s.key === 'complaint_submitted_ack' && s.locale === 'am',
    )!;
    const { html, text } = composeBilingualEmail({
      enHtml: renderTemplate(en.bodyHtml, vars),
      amHtml: renderTemplate(am.bodyHtml, vars),
      enText: renderTemplate(en.bodyText!, vars),
      amText: renderTemplate(am.bodyText!, vars),
    });
    expect(html).toContain('<a href="http://localhost:3000/track/CMS-2026-000006"');
    expect(html).toContain('Track complaint status');
    expect(html).toContain('ቅሬታዎን ይከታተሉ');
    expect(html.indexOf('lang="en"')).toBeLessThan(html.indexOf('lang="am"'));
    expect(text).toContain(trackUrl);
    expect(text).toContain('We received your complaint');
    expect(text).toContain('ቅሬታዎን');
  });
});

describe('loadLocaleTemplates', () => {
  it('requires English template', async () => {
    await expect(
      loadLocaleTemplates(async () => null),
    ).rejects.toThrow('English notification template is required');
  });

  it('loads en and am and calls onMissingAm when am absent', async () => {
    const onMissingAm = jest.fn();
    const result = await loadLocaleTemplates(async (locale) => {
      if (locale === 'en') {
        return {
          subject: 'EN',
          bodyHtml: '<p>en</p>',
          bodyText: 'en',
        };
      }
      return null;
    }, onMissingAm);

    expect(result.en.subject).toBe('EN');
    expect(result.am).toBeNull();
    expect(onMissingAm).toHaveBeenCalled();
  });
});
