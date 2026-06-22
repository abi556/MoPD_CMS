import { Injectable } from '@nestjs/common';

const REFERENCE_PATTERN = /\bCMS-\d{4}-[A-Z0-9]{8,16}\b/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN =
  /(?:\+?251[\s-]?)?(?:0)?(?:9|7)\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\b0\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/gi;

@Injectable()
export class PiiRedactionService {
  redact(text: string): string {
    return text
      .replace(REFERENCE_PATTERN, '[REFERENCE_REDACTED]')
      .replace(EMAIL_PATTERN, '[EMAIL_REDACTED]')
      .replace(PHONE_PATTERN, '[PHONE_REDACTED]');
  }
}
