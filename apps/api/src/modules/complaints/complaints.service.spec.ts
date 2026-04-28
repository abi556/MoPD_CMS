import { NotFoundException } from '@nestjs/common';
import { ComplaintChannel, ComplaintLocale } from './dto/create-complaint.dto';
import { ComplaintsService } from './complaints.service';

describe('ComplaintsService', () => {
  let service: ComplaintsService;
  const complaintCreate = jest.fn();
  const complaintUpdate = jest.fn();
  const complaintFindUnique = jest.fn();
  const transaction = jest.fn();

  beforeEach(() => {
    complaintCreate.mockReset();
    complaintUpdate.mockReset();
    complaintFindUnique.mockReset();
    transaction.mockReset();

    transaction.mockImplementation(
      async <T>(callback: (tx: unknown) => Promise<T>) => {
        const tx = {
          complaint: {
            create: complaintCreate,
            update: complaintUpdate,
          },
        };
        return callback(tx);
      },
    );

    service = new ComplaintsService({
      complaint: {
        findUnique: complaintFindUnique,
      },
      $transaction: transaction,
    } as never);
  });

  it('creates complaint with generated reference number', async () => {
    complaintCreate.mockResolvedValue({
      id: 'cmp_001',
      sequenceNo: 12,
      submittedAt: new Date('2026-04-28T10:00:00.000Z'),
      status: 'SUBMITTED',
      channel: ComplaintChannel.WEB,
      subject: 'Road project delay in zone 3',
      locale: ComplaintLocale.EN,
      consentGiven: true,
    });
    complaintUpdate.mockResolvedValue({
      id: 'cmp_001',
      referenceNo: 'CMS-2026-000012',
      status: 'SUBMITTED',
      channel: ComplaintChannel.WEB,
      subject: 'Road project delay in zone 3',
      description:
        'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
      submittedAt: new Date('2026-04-28T10:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
    });

    const created = await service.create({
      subject: 'Road project delay in zone 3',
      description:
        'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
      channel: ComplaintChannel.WEB,
      consentGiven: true,
      locale: ComplaintLocale.EN,
    });

    expect(created.id).toBe('cmp_001');
    expect(created.referenceNo).toMatch(/^CMS-\d{4}-\d{6}$/);
    expect(created.status).toBe('SUBMITTED');
    expect(created.channel).toBe(ComplaintChannel.WEB);
    expect(complaintCreate).toHaveBeenCalledTimes(1);
    expect(complaintUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns complaint by reference number', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_002',
      referenceNo: 'CMS-2026-000013',
      status: 'SUBMITTED',
      channel: ComplaintChannel.WEB,
      subject: 'Delayed fertilizer delivery',
      description:
        'Fertilizer delivery for kebele farmers has been delayed for the current season without notification.',
      submittedAt: new Date('2026-04-28T10:05:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
    });

    const found = await service.getByReference('CMS-2026-000013');

    expect(found.referenceNo).toBe('CMS-2026-000013');
    expect(found.subject).toBe('Delayed fertilizer delivery');
  });

  it('throws not found for unknown reference number', async () => {
    complaintFindUnique.mockResolvedValue(null);

    await expect(service.getByReference('CMS-2099-999999')).rejects.toThrow(
      NotFoundException,
    );
  });
});
