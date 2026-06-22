import { PiiRedactionService } from './pii-redaction.service';

describe('PiiRedactionService', () => {
  const service = new PiiRedactionService();

  it('redacts complaint reference numbers', () => {
    const result = service.redact('My ref is CMS-2026-ABCD1234WXYZ');
    expect(result).toContain('[REFERENCE_REDACTED]');
    expect(result).not.toContain('CMS-2026');
  });

  it('redacts email addresses', () => {
    const result = service.redact('Contact me at user@example.com');
    expect(result).toContain('[EMAIL_REDACTED]');
  });

  it('redacts Ethiopian phone patterns', () => {
    const result = service.redact('Call me at 0911223344');
    expect(result).toContain('[PHONE_REDACTED]');
  });
});
