import type { VirusScanResult } from '../interfaces/virus-scanner.interface';
import { sanitizePostgresText } from '../document.config';

/** clamd INSTREAM replies are ASCII; responses may include NUL terminators. */
export function parseClamAvResponse(raw: Buffer): VirusScanResult {
  const text = sanitizePostgresText(raw.toString('latin1')) ?? '';
  const cleaned = text.trim();
  if (!cleaned) {
    throw new Error('Empty ClamAV response');
  }

  const streamMatch = cleaned.match(/stream:\s*(.+)$/i);
  const payload = (streamMatch?.[1] ?? cleaned).trim();

  if (/^OK$/i.test(payload)) {
    return { clean: true };
  }

  const foundMatch = payload.match(/^(.+?)\s+FOUND$/i);
  if (foundMatch) {
    return {
      clean: false,
      signature: sanitizePostgresText(foundMatch[1].trim()) ?? 'unknown',
    };
  }

  if (/\bOK\b/i.test(cleaned) && !/FOUND/i.test(cleaned)) {
    return { clean: true };
  }

  const safePreview = sanitizePostgresText(cleaned.slice(0, 200)) ?? 'unknown';
  throw new Error(`Unexpected ClamAV response: ${safePreview}`);
}
