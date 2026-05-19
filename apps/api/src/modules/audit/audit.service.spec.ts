import {
  BadRequestException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AUDIT_EVENT } from './audit-event.types';
import { encodeAuditCursor } from './audit-cursor.util';

describe('AuditService', () => {
  const auditLogCreate = jest.fn();
  const auditLogFindMany = jest.fn();
  const loggerError = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    auditLogCreate.mockReset();
    auditLogFindMany.mockReset();
  });

  afterAll(() => {
    loggerError.mockRestore();
  });

  function createService(): AuditService {
    return new AuditService({
      auditLog: { create: auditLogCreate, findMany: auditLogFindMany },
    } as never);
  }

  it('writes audit event to persistence store', async () => {
    auditLogCreate.mockResolvedValue({ id: 'audit_1' });
    const service = createService();

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
    const service = createService();

    await expect(
      service.logEvent({
        eventType: AUDIT_EVENT.AUTH_LOGIN_FAILED,
      }),
    ).resolves.toBeUndefined();
  });

  it('lists audit logs with filters and cursor pagination', async () => {
    const t1 = new Date('2026-05-15T12:00:00.000Z');
    const t2 = new Date('2026-05-15T11:00:00.000Z');
    auditLogFindMany.mockResolvedValue([
      { id: 'a2', createdAt: t2, eventType: 'x' },
      { id: 'a1', createdAt: t1, eventType: 'x' },
      { id: 'a0', createdAt: new Date('2026-05-15T10:00:00.000Z'), eventType: 'x' },
    ]);
    const service = createService();

    const result = await service.listAuditLogs({
      eventType: 'auth.login.succeeded',
      actorUserId: 'user-1',
      limit: 2,
    });

    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { eventType: 'auth.login.succeeded' },
            { actorUserId: 'user-1' },
          ]),
        }),
      }),
    );
    expect(result.data).toHaveLength(2);
    expect(result.meta.hasNext).toBe(true);
    expect(result.meta.nextCursor).toBe(
      encodeAuditCursor({ createdAt: t1, id: 'a1' }),
    );
  });

  it('rejects invalid date range', async () => {
    const service = createService();
    await expect(
      service.listAuditLogs({
        createdFrom: new Date('2026-05-20T00:00:00.000Z'),
        createdTo: new Date('2026-05-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects invalid cursor', async () => {
    const service = createService();
    await expect(
      service.listAuditLogs({ cursor: 'not-valid' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('exports csv within row cap', async () => {
    auditLogFindMany.mockResolvedValue([
      {
        id: 'a1',
        eventType: 'auth.login.succeeded',
        actorUserId: 'u1',
        entityType: null,
        entityId: null,
        correlationId: null,
        metadata: { k: 1 },
        createdAt: new Date('2026-05-15T12:00:00.000Z'),
      },
    ]);
    const service = createService();

    const csv = await service.exportAuditLogsCsv({
      eventType: 'auth.login.succeeded',
    });

    expect(csv).toContain('id,eventType,actorUserId');
    expect(csv).toContain('auth.login.succeeded');
    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10_001 }),
    );
  });

  it('rejects export when row count exceeds cap', async () => {
    const rows = Array.from({ length: 10_001 }, (_, index) => ({
      id: `a${index}`,
      eventType: 'x',
      actorUserId: null,
      entityType: null,
      entityId: null,
      correlationId: null,
      metadata: null,
      createdAt: new Date(),
    }));
    auditLogFindMany.mockResolvedValue(rows);
    const service = createService();

    await expect(service.exportAuditLogsCsv({})).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});
