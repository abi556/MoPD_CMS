import { Injectable } from '@nestjs/common';
import type {
  EmailProvider,
  EmailSendInput,
  EmailSendResult,
} from './email-provider.interface';

/**
 * Resend adapter placeholder — configure EMAIL_API_KEY and EMAIL_FROM in production.
 * Implement full HTTP API when MoPD domain credentials are available.
 */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  send(input: EmailSendInput): Promise<EmailSendResult> {
    void input;
    if (!process.env.EMAIL_API_KEY) {
      return Promise.reject(
        new Error(
          'Resend email provider is not configured (EMAIL_API_KEY missing)',
        ),
      );
    }
    return Promise.reject(
      new Error(
        'Resend email provider is not implemented yet; use EMAIL_PROVIDER=smtp or console',
      ),
    );
  }
}
