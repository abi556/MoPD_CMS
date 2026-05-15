import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type {
  EmailProvider,
  EmailSendInput,
  EmailSendResult,
} from './email-provider.interface';

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number.parseInt(process.env.SMTP_PORT ?? '1025', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  };
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? 'noreply@localhost';
}

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter = nodemailer.createTransport(getSmtpConfig());

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const info = await this.transporter.sendMail({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: input.headers,
    });
    return { messageId: info.messageId };
  }
}
