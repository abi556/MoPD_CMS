import { NotFoundException } from '@nestjs/common';
import { ComplaintChannel, ComplaintLocale } from './dto/create-complaint.dto';
import { ComplaintsService } from './complaints.service';

describe('ComplaintsService', () => {
  let service: ComplaintsService;

  beforeEach(() => {
    service = new ComplaintsService();
  });

  it('creates complaint with sequential reference number', () => {
    const created = service.create({
      subject: 'Road project delay in zone 3',
      description:
        'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
      channel: ComplaintChannel.WEB,
      consentGiven: true,
      locale: ComplaintLocale.EN,
    });

    expect(created.id).toEqual(expect.any(String));
    expect(created.referenceNo).toMatch(/^CMS-\d{4}-\d{6}$/);
    expect(created.status).toBe('SUBMITTED');
    expect(created.channel).toBe(ComplaintChannel.WEB);
  });

  it('returns complaint by reference number', () => {
    const created = service.create({
      subject: 'Delayed fertilizer delivery',
      description:
        'Fertilizer delivery for kebele farmers has been delayed for the current season without notification.',
      channel: ComplaintChannel.WEB,
      consentGiven: true,
      locale: ComplaintLocale.EN,
    });

    const found = service.getByReference(created.referenceNo);

    expect(found.referenceNo).toBe(created.referenceNo);
    expect(found.subject).toBe('Delayed fertilizer delivery');
  });

  it('throws not found for unknown reference number', () => {
    expect(() => service.getByReference('CMS-2099-999999')).toThrow(
      NotFoundException,
    );
  });
});
