import { BadRequestException } from '@nestjs/common';
import { ComplaintRecoveryService } from './complaint-recovery.service';
import { RecoveryChannel } from './dto/recovery-request.dto';

describe('ComplaintRecoveryService', () => {
  const auditLogEvent = jest.fn().mockResolvedValue(undefined);
  const queueComplaintRecoveryOtp = jest.fn().mockResolvedValue(undefined);

  const prisma = {
    complaint: {
      findMany: jest.fn(),
    },
  };

  let service: ComplaintRecoveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ComplaintRecoveryService(
      prisma as never,
      { logEvent: auditLogEvent } as never,
      { queueComplaintRecoveryOtp } as never,
    );
  });

  it('requestRecovery does not send OTP when no complaints match', async () => {
    prisma.complaint.findMany.mockResolvedValue([]);

    await service.requestRecovery({
      channel: RecoveryChannel.EMAIL,
      email: 'unknown@example.com',
      locale: 'en',
    });

    expect(queueComplaintRecoveryOtp).not.toHaveBeenCalled();
    expect(auditLogEvent).toHaveBeenCalled();
  });

  it('requestRecovery queues OTP email when complaints exist', async () => {
    prisma.complaint.findMany.mockResolvedValue([
      { referenceNo: 'CMS-2026-RECOVERREF01', submittedAt: new Date() },
    ]);

    await service.requestRecovery({
      channel: RecoveryChannel.EMAIL,
      email: 'abebe@example.com',
      locale: 'en',
    });

    expect(queueComplaintRecoveryOtp).toHaveBeenCalledTimes(1);
    expect(queueComplaintRecoveryOtp.mock.calls[0][0]).toBe(
      'abebe@example.com',
    );
  });

  it('verifyRecovery returns references after valid OTP flow', async () => {
    prisma.complaint.findMany.mockResolvedValue([
      {
        referenceNo: 'CMS-2026-RECOVERREF01',
        submittedAt: new Date('2026-04-28T10:00:00.000Z'),
      },
    ]);

    await service.requestRecovery({
      channel: RecoveryChannel.EMAIL,
      email: 'abebe@example.com',
      locale: 'en',
    });

    const otpPlain = queueComplaintRecoveryOtp.mock.calls[0][1] as string;

    const result = await service.verifyRecovery({
      channel: RecoveryChannel.EMAIL,
      email: 'abebe@example.com',
      locale: 'en',
      code: otpPlain,
    });

    expect(result.references).toHaveLength(1);
    expect(result.references[0].referenceNo).toBe(
      'CMS-2026-RECOVERREF01',
    );
  });

  it('verifyRecovery rejects invalid code', async () => {
    prisma.complaint.findMany.mockResolvedValue([
      {
        referenceNo: 'CMS-2026-RECOVERREF01',
        submittedAt: new Date(),
      },
    ]);

    await service.requestRecovery({
      channel: RecoveryChannel.EMAIL,
      email: 'abebe@example.com',
      locale: 'en',
    });

    await expect(
      service.verifyRecovery({
        channel: RecoveryChannel.EMAIL,
        email: 'abebe@example.com',
        locale: 'en',
        code: '000000',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
