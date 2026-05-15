import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailProvider,
  EmailSendInput,
  EmailSendResult,
} from './email-provider.interface';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  send(input: EmailSendInput): Promise<EmailSendResult> {
    this.logger.log(
      JSON.stringify({
        channel: 'email',
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    );
    return Promise.resolve({ messageId: 'console-dev' });
  }
}
