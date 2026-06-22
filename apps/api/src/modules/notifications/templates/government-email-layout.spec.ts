import { composeBilingualEmail } from './bilingual-email';
import { wrapGovernmentEmailDocument } from './government-email-layout';

describe('wrapGovernmentEmailDocument', () => {
  it('includes MoPD logo, fern header, and public footer links', () => {
    process.env.APP_PUBLIC_URL = 'https://mopdcms.gov.et';
    const html = wrapGovernmentEmailDocument({
      enHtml: '<p>Hello</p>',
      amHtml: '<p>ሰላም</p>',
      preheader: 'Test preheader',
    });

    expect(html).toContain('mopd_logo.png');
    expect(html).toContain('#527f47');
    expect(html).toContain('mopd.gov.et');
    expect(html).toContain('mopdcms.gov.et');
    expect(html).toContain('lang="en"');
    expect(html).toContain('lang="am"');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Test preheader');
  });
});

describe('composeBilingualEmail branded shell', () => {
  it('appends government footer to plain text', () => {
    const { text } = composeBilingualEmail({
      enHtml: '<p>Hello EN</p>',
      amHtml: '',
      enText: 'Hello EN',
    });
    expect(text).toContain('mopd.gov.et');
    expect(text).toContain('support@mopd.gov.et');
  });
});
