import { Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AUDIT_EVENT } from './audit-event.types';

describe('AuditService', () => {
  const auditLogCreate = jest.fn();
  const loggerError = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    auditLogCreate.mockReset();
  });

  afterAll(() => {
    loggerError.mockRestore();
  });

  it('writes audit event to persistence store', async () => {
    auditLogCreate.mockResolvedValue({ id: 'audit_1' });
    const service = new AuditService({
      auditLog: { create: auditLogCreate },
    } as never);

    await service.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_CREATED,
      actorUserId: 'user-1',
      entityType: 'complaint',
      entityId: 'cmp_1',
      correlationId: 'corr-1',
      metadata: { key: 'value' },
    });

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: AUDIT_EVENT.COMPLAINT_CREATED,
        actorUserId: 'user-1',
        entityType: 'complaint',
        entityId: 'cmp_1',
        correlationId: 'corr-1',
      }),
    });
  });

  it('does not throw when persistence fails', async () => {
    auditLogCreate.mockRejectedValue(new Error('db down'));
    const service = new AuditService({
      auditLog: { create: auditLogCreate },
    } as never);

    await expect(
      service.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGIN_FAILED,
      }),
    ).resolves.toBeUndefined();
  });
});
