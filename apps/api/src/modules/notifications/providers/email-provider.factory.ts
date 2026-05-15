import { Injectable } from '@nestjs/common';
import { ConsoleEmailProvider } from './console-email.provider';
import type { EmailProvider } from './email-provider.interface';
import { ResendEmailProvider } from './resend-email.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

export type EmailProviderKind = 'console' | 'smtp' | 'resend';

@Injectable()
export class EmailProviderFactory {
  constructor(
    private readonly consoleProvider: ConsoleEmailProvider,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly resendProvider: ResendEmailProvider,
  ) {}

  getProvider(): EmailProvider {
    const kind = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
    switch (kind as EmailProviderKind) {
      case 'smtp':
        return this.smtpProvider;
      case 'resend':
        return this.resendProvider;
      case 'console':
      default:
        return this.consoleProvider;
    }
  }
}
