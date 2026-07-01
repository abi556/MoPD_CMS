import { Injectable, Logger } from '@nestjs/common';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { EmailProviderFactory } from '../notifications/providers/email-provider.factory';
import { SubmitContactDto } from './dto/submit-contact.dto';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getContactInboxEmail(): string {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.MOPD_SUPPORT_EMAIL?.trim() ||
    'support@mopd.gov.et'
  );
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly emailFactory: EmailProviderFactory,
    private readonly audit: AuditService,
  ) {}

  async submit(
    input: SubmitContactDto,
    correlationId?: string,
  ): Promise<{ message: string }> {
    const inbox = getContactInboxEmail();
    const senderName = input.name?.trim() || 'Anonymous';
    const subject = `[MoPD CMS Contact] ${input.subject.trim()}`;
    const text = [
      `From: ${senderName} <${input.email}>`,
      '',
      input.message.trim(),
    ].join('\n');
    const html = [
      `<p><strong>From:</strong> ${escapeHtml(senderName)} &lt;${escapeHtml(input.email)}&gt;</p>`,
      `<p>${escapeHtml(input.message.trim()).replace(/\n/g, '<br/>')}</p>`,
    ].join('');

    const provider = this.emailFactory.getProvider();
    await provider.send({
      to: inbox,
      subject,
      html,
      text,
      headers: {
        'Reply-To': input.email,
      },
    });

    await this.audit.logEvent({
      eventType: AUDIT_EVENT.CONTACT_FORM_SUBMITTED,
      entityType: 'contact_message',
      correlationId,
      metadata: {
        subject: input.subject.trim(),
        senderEmailDomain: input.email.split('@')[1] ?? null,
        hasName: Boolean(input.name?.trim()),
      },
    });

    this.logger.log(`Contact form delivered to ${inbox}`);

    return {
      message:
        'Thank you for contacting the Ministry of Planning and Development. We have received your message.',
    };
  }
}
