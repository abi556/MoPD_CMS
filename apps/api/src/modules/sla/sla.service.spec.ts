import { NotFoundException } from '@nestjs/common';
import { Priority, SlaStatus } from '@prisma/client';
import { SlaService } from './sla.service';

describe('SlaService', () => {
  let service: SlaService;

  // Prisma mock fns
  const slaConfigCreate = jest.fn();
  const slaConfigFindFirst = jest.fn();
  const slaConfigFindMany = jest.fn();
  const slaConfigFindUniqueOrThrow = jest.fn();
  const slaConfigUpdate = jest.fn();
  const slaConfigUpsert = jest.fn();
  const complaintSlaCreate = jest.fn();
  const complaintSlaFindUnique = jest.fn();
  const complaintSlaFindMany = jest.fn();
  const complaintSlaUpdate = jest.fn();
  const complaintSlaUpdateMany = jest.fn();
  const complaintSlaCount = jest.fn();
  const logEvent = jest.fn();
  const notify = jest.fn();
  const notifyMany = jest.fn();
  const userRoleFindMany = jest.fn();

  const mockComplaintAccess = {
    buildListScopeFilter: jest.fn().mockReturnValue({}),
  };

  const mockPrisma = {
    slaConfig: {
      create: slaConfigCreate,
      findFirst: slaConfigFindFirst,
      findMany: slaConfigFindMany,
      findUniqueOrThrow: slaConfigFindUniqueOrThrow,
      update: slaConfigUpdate,
      upsert: slaConfigUpsert,
    },
    complaintSla: {
      create: complaintSlaCreate,
      findUnique: complaintSlaFindUnique,
      findMany: complaintSlaFindMany,
      update: complaintSlaUpdate,
      updateMany: complaintSlaUpdateMany,
      count: complaintSlaCount,
    },
    userRole: {
      findMany: userRoleFindMany,
    },
  };

  const mockAudit = { logEvent };
  const mockInApp = { notify, notifyMany };

  beforeEach(() => {
    jest.clearAllMocks();
    logEvent.mockResolvedValue(undefined);
    notify.mockResolvedValue(null);
    notifyMany.mockResolvedValue(undefined);
    userRoleFindMany.mockResolvedValue([]);
    mockComplaintAccess.buildListScopeFilter.mockReturnValue({});
    service = new SlaService(
      mockPrisma as never,
      mockAudit as never,
      mockComplaintAccess as never,
      mockInApp as never,
    );
  });

  // ---------------------------------------------------------------------------
  // pickSlaConfig
  // ---------------------------------------------------------------------------
  describe('pickSlaConfig', () => {
    it('returns category-specific config when available', async () => {
      const specific = {
        id: 'cfg_cat',
        name: 'Cat-specific',
        targetHours: 12,
        warningThresholdPct: 80,
      };
      slaConfigFindFirst.mockResolvedValueOnce(specific);

      const result = await service.pickSlaConfig(Priority.HIGH, 'cat-abc');
      expect(result).toEqual(specific);
      expect(slaConfigFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-abc' }),
        }),
      );
    });

    it('falls back to generic config (categoryId null) when no category-specific config', async () => {
      const generic = {
        id: 'cfg_gen',
        name: 'Generic HIGH',
        targetHours: 24,
        warningThresholdPct: 80,
      };
      slaConfigFindFirst
        .mockResolvedValueOnce(null) // category-specific miss
        .mockResolvedValueOnce(generic); // generic fallback hit

      const result = await service.pickSlaConfig(Priority.HIGH, 'cat-abc');
      expect(result).toEqual(generic);
      expect(slaConfigFindFirst).toHaveBeenCalledTimes(2);
    });

    it('returns generic config directly when no categoryId given', async () => {
      const generic = {
        id: 'cfg_gen',
        name: 'Generic NORMAL',
        targetHours: 72,
        warningThresholdPct: 80,
      };
      slaConfigFindFirst.mockResolvedValueOnce(generic);

      const result = await service.pickSlaConfig(Priority.NORMAL, null);
      expect(result).toEqual(generic);
      expect(slaConfigFindFirst).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // startTrackerForComplaint
  // ---------------------------------------------------------------------------
  describe('startTrackerForComplaint', () => {
    it('computes targetAt and warningAt correctly', async () => {
      const targetHours = 24;
      const warningPct = 80;
      const config = {
        id: 'cfg_1',
        name: 'Test',
        targetHours,
        warningThresholdPct: warningPct,
      };
      slaConfigFindFirst.mockResolvedValue(config);
      complaintSlaCreate.mockResolvedValue({});

      const before = Date.now();
      await service.startTrackerForComplaint(
        'cmp_1',
        Priority.HIGH,
        null,
        'corr-1',
      );
      const after = Date.now();

      const createCall = complaintSlaCreate.mock.calls[0][0].data;
      const targetMs = targetHours * 3_600_000;
      const warningMs = targetMs * (warningPct / 100);

      // target and warning offsets must be within the call window
      expect(createCall.targetAt.getTime()).toBeGreaterThanOrEqual(
        before + targetMs,
      );
      expect(createCall.targetAt.getTime()).toBeLessThanOrEqual(
        after + targetMs,
      );
      expect(createCall.warningAt.getTime()).toBeGreaterThanOrEqual(
        before + warningMs,
      );
      expect(createCall.warningAt.getTime()).toBeLessThanOrEqual(
        after + warningMs,
      );
      expect(createCall.status).toBe(SlaStatus.ACTIVE);
    });

    it('logs a warning and skips creation when no config found', async () => {
      slaConfigFindFirst.mockResolvedValue(null);
      await service.startTrackerForComplaint('cmp_2', Priority.LOW, null);
      expect(complaintSlaCreate).not.toHaveBeenCalled();
    });

    it('emits SLA_TRACKER_STARTED audit event', async () => {
      const config = {
        id: 'cfg_1',
        name: 'Test',
        targetHours: 8,
        warningThresholdPct: 80,
      };
      slaConfigFindFirst.mockResolvedValue(config);
      complaintSlaCreate.mockResolvedValue({});

      await service.startTrackerForComplaint(
        'cmp_3',
        Priority.URGENT,
        null,
        'corr-2',
      );
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'sla.tracker.started',
          entityId: 'cmp_3',
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // completeTracker
  // ---------------------------------------------------------------------------
  describe('completeTracker', () => {
    it('sets status COMPLETED and writes audit event', async () => {
      const tracker = {
        id: 't1',
        complaintId: 'cmp_4',
        status: SlaStatus.ACTIVE,
      };
      complaintSlaFindUnique.mockResolvedValue(tracker);
      complaintSlaUpdate.mockResolvedValue({
        ...tracker,
        status: SlaStatus.COMPLETED,
      });

      await service.completeTracker('cmp_4', 'resolved', 'corr-3');
      expect(complaintSlaUpdate).toHaveBeenCalled();
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'sla.tracker.completed',
          entityId: 'cmp_4',
        }),
      );
    });

    it('is a no-op when tracker is already COMPLETED', async () => {
      complaintSlaFindUnique.mockResolvedValue({ status: SlaStatus.COMPLETED });
      await service.completeTracker('cmp_5', 'closed again');
      expect(complaintSlaUpdate).not.toHaveBeenCalled();
      expect(logEvent).not.toHaveBeenCalled();
    });

    it('is a no-op when no tracker exists', async () => {
      complaintSlaFindUnique.mockResolvedValue(null);
      await service.completeTracker('cmp_6', 'no tracker');
      expect(complaintSlaUpdate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getStatusForComplaint
  // ---------------------------------------------------------------------------
  describe('getStatusForComplaint', () => {
    it('throws NotFoundException when no tracker', async () => {
      complaintSlaFindUnique.mockResolvedValue(null);
      await expect(service.getStatusForComplaint('cmp_99')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a correctly shaped SlaStatusResponseDto', async () => {
      const now = new Date('2026-05-12T10:00:00.000Z');
      const targetAt = new Date(now.getTime() + 3_600_000); // 1h from now
      const warningAt = new Date(now.getTime() + 2_880_000);
      const tracker = {
        complaintId: 'cmp_7',
        slaConfig: { name: 'Test Config' },
        status: SlaStatus.ACTIVE,
        startedAt: now,
        targetAt,
        warningAt,
        warnedAt: null,
        breachedAt: null,
        completedAt: null,
      };
      complaintSlaFindUnique.mockResolvedValue(tracker);

      const result = await service.getStatusForComplaint('cmp_7');
      expect(result.slaConfigName).toBe('Test Config');
      expect(result.isWarned).toBe(false);
      expect(result.isBreached).toBe(false);
      expect(typeof result.remainingMs).toBe('number');
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateActive — idempotent warn + breach
  // ---------------------------------------------------------------------------
  describe('evaluateActive', () => {
    it('sets warnedAt exactly once (idempotent)', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      const tracker = {
        id: 't_warn',
        complaintId: 'cmp_8',
        slaConfigId: 'cfg_1',
        status: SlaStatus.ACTIVE,
        warningAt: past, // warning threshold already passed
        targetAt: new Date(now.getTime() + 3_600_000), // not yet breached
        warnedAt: null, // not yet warned
        breachedAt: null,
        slaConfig: {
          name: 'Test',
          warningThresholdPct: 80,
          escalationRoleId: null,
        },
        complaint: {
          id: 'cmp_8',
          referenceNo: 'CMP-008',
          assignedToUserId: 'user-officer-0001',
        },
      };
      complaintSlaFindMany.mockResolvedValue([tracker]);
      complaintSlaUpdateMany.mockResolvedValue({ count: 1 });

      await service.evaluateActive();

      // updateMany called for warning, NOT for breach
      const calls = complaintSlaUpdateMany.mock.calls;
      const warnCall = calls.find((c) => c[0].where.warnedAt === null);
      const breachCall = calls.find((c) => c[0].where.breachedAt === null);
      expect(warnCall).toBeDefined();
      expect(breachCall).toBeUndefined();
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'sla.warning_emitted' }),
      );
    });

    it('sets breachedAt exactly once (idempotent)', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      const tracker = {
        id: 't_breach',
        complaintId: 'cmp_9',
        slaConfigId: 'cfg_1',
        status: SlaStatus.ACTIVE,
        warningAt: past,
        targetAt: past, // both warning and target passed
        warnedAt: now, // already warned
        breachedAt: null,
        slaConfig: {
          name: 'Test',
          warningThresholdPct: 80,
          escalationRoleId: 'role-admin',
        },
        complaint: {
          id: 'cmp_9',
          referenceNo: 'CMP-009',
          assignedToUserId: 'user-officer-0001',
        },
      };
      complaintSlaFindMany.mockResolvedValue([tracker]);
      complaintSlaUpdateMany.mockResolvedValue({ count: 1 });

      await service.evaluateActive();

      const calls = complaintSlaUpdateMany.mock.calls;
      const warnCall = calls.find((c) => c[0].where.warnedAt === null);
      const breachCall = calls.find((c) => c[0].where.breachedAt === null);
      expect(warnCall).toBeUndefined();
      expect(breachCall).toBeDefined();
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'sla.breached' }),
      );
    });

    it('does nothing when no active trackers', async () => {
      complaintSlaFindMany.mockResolvedValue([]);
      await service.evaluateActive();
      expect(complaintSlaUpdateMany).not.toHaveBeenCalled();
      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // countAtRiskComplaints
  // ---------------------------------------------------------------------------
  describe('countAtRiskComplaints', () => {
    it('counts open complaints with warned or breached SLA', async () => {
      complaintSlaCount.mockResolvedValue(7);
      const user = { id: 'user_1', permissions: ['complaint:read'] };

      const count = await service.countAtRiskComplaints(user as never);

      expect(count).toBe(7);
      expect(mockComplaintAccess.buildListScopeFilter).toHaveBeenCalledWith(
        user,
      );
      expect(complaintSlaCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completedAt: null,
            complaint: expect.objectContaining({
              status: { not: 'CLOSED' },
            }),
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // escalateComplaint
  // ---------------------------------------------------------------------------
  describe('escalateComplaint', () => {
    it('writes COMPLAINT_ESCALATED audit event', async () => {
      complaintSlaFindUnique.mockResolvedValue({ id: 't_esc' });
      await service.escalateComplaint(
        'cmp_10',
        'user_1',
        'No response',
        'corr-5',
      );
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'complaint.escalated',
          entityId: 'cmp_10',
          actorUserId: 'user_1',
        }),
      );
    });

    it('still writes audit even when no SLA tracker exists', async () => {
      complaintSlaFindUnique.mockResolvedValue(null);
      await service.escalateComplaint('cmp_11', 'user_2', 'Manual escalation');
      expect(logEvent).toHaveBeenCalled();
    });
  });
});
