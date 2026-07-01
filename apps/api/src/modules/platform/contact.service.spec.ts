import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { EmailProviderFactory } from '../notifications/providers/email-provider.factory';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  const send = jest.fn().mockResolvedValue({ messageId: 'test' });
  const logEvent = jest.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    send.mockClear();
    logEvent.mockClear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: EmailProviderFactory,
          useValue: { getProvider: () => ({ send }) },
        },
        {
          provide: AuditService,
          useValue: { logEvent },
        },
      ],
    }).compile();

    service = module.get(ContactService);
  });

  it('sends contact email and audits submission', async () => {
    const result = await service.submit(
      {
        email: 'citizen@example.com',
        subject: 'Help',
        message: 'Need assistance',
        name: 'Abebe',
      },
      'corr-1',
    );

    expect(result.message).toContain('received your message');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        subject: expect.stringContaining('Help'),
        headers: { 'Reply-To': 'citizen@example.com' },
      }),
    );
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT.CONTACT_FORM_SUBMITTED,
        correlationId: 'corr-1',
      }),
    );
  });
});
