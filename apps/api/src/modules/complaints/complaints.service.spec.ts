import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ComplaintChannel, ComplaintLocale } from './dto/create-complaint.dto';
import { ComplaintStatusValue } from './dto/complaint-status.enum';
import { ComplaintsService } from './complaints.service';
import { ComplaintAccessService } from './complaint-access.service';
import { WorkflowPolicyService } from './workflow-policy.service';
import { ListComplaintsQueryDto } from './dto/list-complaints.dto';
import { UnprocessableEntityException } from '@nestjs/common';

const staffUser = {
  id: 'user-officer-0001',
  email: 'officer@mopd.local',
  roles: ['CaseOfficer'],
  permissions: ['complaints:list', 'complaint:read:own'],
};

describe('ComplaintsService', () => {
  let service: ComplaintsService;
  let complaintAccessService: jest.Mocked<
    Pick<
      ComplaintAccessService,
      'buildListScopeFilter' | 'assertCanAccessComplaint'
    >
  >;
  let workflowPolicyService: jest.Mocked<
    Pick<WorkflowPolicyService, 'assertCanAssign' | 'assertCanTransition'>
  >;
  const logEvent = jest.fn();
  const complaintCreate = jest.fn();
  const complaintHistoryCreate = jest.fn();
  const complaintHistoryFindMany = jest.fn();
  const complaintUpdate = jest.fn();
  const complaintFindUnique = jest.fn();
  const complaintFindMany = jest.fn();
  const complaintCount = jest.fn();
  const transaction = jest.fn();
  const complaintCategoryFindUnique = jest.fn();
  const orgUnitFindUnique = jest.fn();
  const queueComplaintSubmittedAck = jest.fn().mockResolvedValue(undefined);
  const queueComplaintTransitionIfApplicable = jest
    .fn()
    .mockResolvedValue(undefined);

  beforeEach(() => {
    complaintCreate.mockReset();
    complaintHistoryCreate.mockReset();
    complaintHistoryFindMany.mockReset();
    complaintUpdate.mockReset();
    complaintFindUnique.mockReset();
    complaintFindMany.mockReset();
    complaintCount.mockReset();
    transaction.mockReset();
    complaintCategoryFindUnique.mockReset();
    orgUnitFindUnique.mockReset();
    logEvent.mockReset();
    logEvent.mockResolvedValue(undefined);
    queueComplaintSubmittedAck.mockReset();
    queueComplaintSubmittedAck.mockResolvedValue(undefined);
    queueComplaintTransitionIfApplicable.mockReset();
    queueComplaintTransitionIfApplicable.mockResolvedValue(undefined);

    transaction.mockImplementation(
      async <T>(callback: (tx: unknown) => Promise<T>) => {
        const tx = {
          complaint: {
            create: complaintCreate,
            update: complaintUpdate,
            findUnique: complaintFindUnique,
          },
          complaintHistory: {
            create: complaintHistoryCreate,
          },
        };
        return callback(tx);
      },
    );

    complaintAccessService = {
      buildListScopeFilter: jest.fn().mockReturnValue({}),
      assertCanAccessComplaint: jest.fn(),
    };
    workflowPolicyService = {
      assertCanAssign: jest.fn(),
      assertCanTransition: jest.fn(),
    };

    service = new ComplaintsService(
      {
        complaint: {
          count: complaintCount,
          findMany: complaintFindMany,
          findUnique: complaintFindUnique,
          update: complaintUpdate,
        },
        complaintCategory: {
          findUnique: complaintCategoryFindUnique,
        },
        orgUnit: {
          findUnique: orgUnitFindUnique,
        },
        complaintHistory: {
          findMany: complaintHistoryFindMany,
        },
        $transaction: transaction,
      } as never,
      {
        logEvent,
      } as never,
      {
        startTrackerForComplaint: jest.fn().mockResolvedValue(undefined),
        completeTracker: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        queueComplaintSubmittedAck,
        queueComplaintTransitionIfApplicable,
      } as never,
      complaintAccessService,
      workflowPolicyService,
    );
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
      referenceNo: 'CMS-2026-ABCDEFGHJKL1',
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

    expect(created.complaint.id).toBe('cmp_001');
    expect(created.complaint.referenceNo).toMatch(
      /^CMS-\d{4}-[A-Z0-9]{12}$/,
    );
    expect(created.complaint.status).toBe('SUBMITTED');
    expect(created.complaint.channel).toBe(ComplaintChannel.WEB);
    expect(complaintCreate).toHaveBeenCalledTimes(1);
    expect(complaintUpdate).toHaveBeenCalledTimes(1);
    expect(created.ackEmailQueued).toBe(false);
    expect(queueComplaintSubmittedAck).not.toHaveBeenCalled();
  });

  it('queues submission acknowledgement when complainant email is provided', async () => {
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
      referenceNo: 'CMS-2026-ABCDEFGHJKL1',
      status: 'SUBMITTED',
      channel: ComplaintChannel.WEB,
      subject: 'Road project delay in zone 3',
      description:
        'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
      submittedAt: new Date('2026-04-28T10:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: 'Abebe',
      complainantEmail: 'abebe@example.com',
      complainantPhone: null,
    });

    const created = await service.create({
      subject: 'Road project delay in zone 3',
      description:
        'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
      channel: ComplaintChannel.WEB,
      consentGiven: true,
      locale: ComplaintLocale.EN,
      complainantEmail: 'abebe@example.com',
    });

    expect(created.ackEmailQueued).toBe(true);
    expect(queueComplaintSubmittedAck).toHaveBeenCalledTimes(1);
    expect(queueComplaintSubmittedAck).toHaveBeenCalledWith(
      'abebe@example.com',
      'CMS-2026-ABCDEFGHJKL1',
      'en',
      undefined,
    );
  });

  it('returns complaint by reference number', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_002',
      referenceNo: 'CMS-2026-ZYXWVUTSRQ12',
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

    const found = await service.getByReference(
      'CMS-2026-ZYXWVUTSRQ12',
    );

    expect(found.referenceNo).toBe('CMS-2026-ZYXWVUTSRQ12');
    expect(found.subject).toBe('Delayed fertilizer delivery');
  });

  it('throws not found for unknown reference number', async () => {
    complaintFindUnique.mockResolvedValue(null);

    await expect(service.getByReference('CMS-2099-999999')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns complaint by internal id for staff details view', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_099',
      referenceNo: 'CMS-2026-REFEMAILTOKN1',
      status: 'SUBMITTED',
      channel: ComplaintChannel.EMAIL,
      subject: 'Missing medicine stock',
      description:
        'Public clinic has no stock for the listed medicine for two weeks.',
      submittedAt: new Date('2026-04-29T10:05:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: 'Sami Yonas',
      complainantEmail: 'sami@example.com',
      complainantPhone: '+251922334455',
    });

    const found = await service.getByIdForStaff('cmp_099', staffUser);

    expect(found.id).toBe('cmp_099');
    expect(found.referenceNo).toBe('CMS-2026-REFEMAILTOKN1');
    expect(found.complainantEmail).toBe('sami@example.com');
  });

  it('throws not found for unknown complaint id', async () => {
    complaintFindUnique.mockResolvedValue(null);

    await expect(
      service.getByIdForStaff('cmp_missing', staffUser),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists complaints for staff using filters and pagination', async () => {
    complaintFindMany.mockResolvedValue([
      {
        id: 'cmp_010',
        referenceNo: 'CMS-2026-TRACKLIST001',
        status: 'SUBMITTED',
        channel: ComplaintChannel.WEB,
        subject: 'Water service interruption',
        description: 'Water service has been interrupted for three days.',
        submittedAt: new Date('2026-04-29T09:00:00.000Z'),
        locale: ComplaintLocale.EN,
        consentGiven: true,
        complainantName: null,
        complainantEmail: null,
        complainantPhone: null,
      },
    ]);
    complaintCount.mockResolvedValue(1);

    const query: ListComplaintsQueryDto = {
      page: 1,
      pageSize: 10,
      status: ComplaintStatusValue.SUBMITTED,
      channel: ComplaintChannel.WEB,
      locale: ComplaintLocale.EN,
      submittedFrom: '2026-04-01T00:00:00.000Z',
      submittedTo: '2026-04-30T23:59:59.999Z',
    };

    const result = await service.listForStaff(query, staffUser);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.referenceNo).toBe(
      'CMS-2026-TRACKLIST001',
    );
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    expect(complaintFindMany).toHaveBeenCalledTimes(1);
    expect(complaintCount).toHaveBeenCalledTimes(1);
  });

  it('assigns complaint and updates status to ASSIGNED', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_011',
      referenceNo: 'CMS-2026-ASSIGNSTATE0',
      status: 'TRIAGE',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
    });
    complaintUpdate.mockResolvedValue({
      id: 'cmp_011',
      referenceNo: 'CMS-2026-ASSIGNSTATE0',
      status: 'ASSIGNED',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
      assignedToUserId: 'user-officer-0001',
      assignedByUserId: 'user-admin-0001',
      assignedAt: new Date('2026-04-29T12:00:00.000Z'),
      assignmentReason: 'Routing based on transport infrastructure expertise.',
    });

    const assigned = await service.assignComplaint(
      'cmp_011',
      'user-officer-0001',
      'user-admin-0001',
      'Routing based on transport infrastructure expertise.',
    );

    expect(assigned.status).toBe(ComplaintStatusValue.ASSIGNED);
    expect(assigned.assignedToUserId).toBe('user-officer-0001');
    expect(assigned.assignedByUserId).toBe('user-admin-0001');
    expect(complaintHistoryCreate).toHaveBeenCalledTimes(1);
    expect(complaintUpdate).toHaveBeenCalledTimes(1);
  });

  it('rejects assignment when complaint is not in TRIAGE or APPEAL', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_012',
      referenceNo: 'CMS-2026-ASSIGNREJECT0',
      status: 'SUBMITTED',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
    });

    await expect(
      service.assignComplaint(
        'cmp_012',
        'user-officer-0001',
        'user-admin-0001',
        'Routing based on transport infrastructure expertise.',
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('transitions complaint from ASSIGNED to IN_INVESTIGATION', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_020',
      referenceNo: 'CMS-2026-TRANSITION01',
      status: 'ASSIGNED',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
      assignedToUserId: 'user-officer-0001',
      assignedByUserId: 'user-admin-0001',
      assignedAt: new Date('2026-04-29T12:00:00.000Z'),
      assignmentReason: 'Routing based on transport infrastructure expertise.',
    });
    complaintUpdate.mockResolvedValue({
      id: 'cmp_020',
      referenceNo: 'CMS-2026-TRANSITION01',
      status: 'IN_INVESTIGATION',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
      assignedToUserId: 'user-officer-0001',
      assignedByUserId: 'user-admin-0001',
      assignedAt: new Date('2026-04-29T12:00:00.000Z'),
      assignmentReason: 'Routing based on transport infrastructure expertise.',
      lastTransitionByUserId: 'user-officer-0001',
      lastTransitionAt: new Date('2026-04-29T13:00:00.000Z'),
      lastTransitionReason: 'Field verification started by assigned officer.',
    });

    const transitioned = await service.transitionComplaint(
      'cmp_020',
      ComplaintStatusValue.IN_INVESTIGATION,
      'user-officer-0001',
      'Field verification started by assigned officer.',
    );

    expect(transitioned.status).toBe(ComplaintStatusValue.IN_INVESTIGATION);
    expect(transitioned.lastTransitionReason).toBe(
      'Field verification started by assigned officer.',
    );
    expect(complaintHistoryCreate).toHaveBeenCalledTimes(1);
    expect(queueComplaintTransitionIfApplicable).not.toHaveBeenCalled();
  });

  it('queues transition email when notify list includes target status', async () => {
    const prev = process.env.NOTIFY_TRANSITION_STATUSES;
    process.env.NOTIFY_TRANSITION_STATUSES = 'IN_INVESTIGATION';

    complaintFindUnique.mockResolvedValue({
      id: 'cmp_020',
      referenceNo: 'CMS-2026-TRANSITION01',
      status: 'ASSIGNED',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: 'Hanna',
      complainantEmail: 'hanna@example.com',
      complainantPhone: null,
      assignedToUserId: 'user-officer-0001',
      assignedByUserId: 'user-admin-0001',
      assignedAt: new Date('2026-04-29T12:00:00.000Z'),
      assignmentReason: 'Routing based on transport infrastructure expertise.',
    });
    complaintUpdate.mockResolvedValue({
      id: 'cmp_020',
      referenceNo: 'CMS-2026-TRANSITION01',
      status: 'IN_INVESTIGATION',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: 'Hanna',
      complainantEmail: 'hanna@example.com',
      complainantPhone: null,
      assignedToUserId: 'user-officer-0001',
      assignedByUserId: 'user-admin-0001',
      assignedAt: new Date('2026-04-29T12:00:00.000Z'),
      assignmentReason: 'Routing based on transport infrastructure expertise.',
      lastTransitionByUserId: 'user-officer-0001',
      lastTransitionAt: new Date('2026-04-29T13:00:00.000Z'),
      lastTransitionReason: 'Field verification started by assigned officer.',
    });

    await service.transitionComplaint(
      'cmp_020',
      ComplaintStatusValue.IN_INVESTIGATION,
      'user-officer-0001',
      'Field verification started by assigned officer.',
      'corr-tx',
    );

    expect(queueComplaintTransitionIfApplicable).toHaveBeenCalledWith(
      'hanna@example.com',
      'CMS-2026-TRANSITION01',
      'IN_INVESTIGATION',
      'en',
      'corr-tx',
    );

    process.env.NOTIFY_TRANSITION_STATUSES = prev;
  });

  it('rejects invalid workflow transition with unprocessable error', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_021',
      referenceNo: 'CMS-2026-INVALIDSTATE',
      status: 'SUBMITTED',
      channel: ComplaintChannel.WEB,
      subject: 'Road grading incomplete',
      description: 'Road grading activity stopped mid-way.',
      submittedAt: new Date('2026-04-29T09:00:00.000Z'),
      locale: ComplaintLocale.EN,
      consentGiven: true,
      complainantName: null,
      complainantEmail: null,
      complainantPhone: null,
    });

    await expect(
      service.transitionComplaint(
        'cmp_021',
        ComplaintStatusValue.CLOSED,
        'user-officer-0001',
        'Attempt to skip mandatory state.',
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('returns complaint history timeline by complaint id', async () => {
    complaintFindUnique.mockResolvedValue({
      id: 'cmp_030',
    });
    complaintHistoryFindMany.mockResolvedValue([
      {
        id: 'hist_001',
        complaintId: 'cmp_030',
        action: 'ASSIGNED',
        fromStatus: 'SUBMITTED',
        toStatus: 'ASSIGNED',
        actorUserId: 'user-admin-0001',
        reason: 'Initial assignment.',
        createdAt: new Date('2026-04-29T12:00:00.000Z'),
      },
      {
        id: 'hist_002',
        complaintId: 'cmp_030',
        action: 'TRANSITIONED',
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_INVESTIGATION',
        actorUserId: 'user-officer-0001',
        reason: 'Started field verification.',
        createdAt: new Date('2026-04-29T13:00:00.000Z'),
      },
    ]);

    const history = await service.getHistoryForStaff('cmp_030', staffUser);

    expect(history).toHaveLength(2);
    expect(history[0]?.action).toBe('ASSIGNED');
    expect(history[1]?.toStatus).toBe(ComplaintStatusValue.IN_INVESTIGATION);
  });

  describe('create with categoryId / orgUnitId', () => {
    const basePayload = {
      subject: 'Road project delay in zone 3',
      description:
        'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
      channel: ComplaintChannel.WEB,
      consentGiven: true,
      locale: ComplaintLocale.EN,
    };

    it('rejects when categoryId references no row', async () => {
      complaintCategoryFindUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...basePayload, categoryId: 'missing-cat' }),
      ).rejects.toThrow(BadRequestException);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects when category exists but is inactive', async () => {
      complaintCategoryFindUnique.mockResolvedValue({
        id: 'cat-1',
        isActive: false,
      });

      await expect(
        service.create({ ...basePayload, categoryId: 'cat-1' }),
      ).rejects.toThrow(BadRequestException);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects when orgUnitId references no row', async () => {
      orgUnitFindUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...basePayload, orgUnitId: 'missing-org' }),
      ).rejects.toThrow(BadRequestException);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects when org unit exists but is inactive', async () => {
      orgUnitFindUnique.mockResolvedValue({
        id: 'org-1',
        isActive: false,
      });

      await expect(
        service.create({ ...basePayload, orgUnitId: 'org-1' }),
      ).rejects.toThrow(BadRequestException);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('creates when category and org unit are active', async () => {
      complaintCategoryFindUnique.mockResolvedValue({
        id: 'cat-active',
        isActive: true,
      });
      orgUnitFindUnique.mockResolvedValue({
        id: 'org-active',
        isActive: true,
      });

      complaintCreate.mockResolvedValue({
        id: 'cmp_cat_org',
        sequenceNo: 99,
        submittedAt: new Date('2026-04-28T10:00:00.000Z'),
        status: 'SUBMITTED',
        priority: 'NORMAL',
        channel: ComplaintChannel.WEB,
        subject: basePayload.subject,
        locale: ComplaintLocale.EN,
        consentGiven: true,
        categoryId: 'cat-active',
        orgUnitId: 'org-active',
      });
      complaintUpdate.mockResolvedValue({
        id: 'cmp_cat_org',
        referenceNo: 'CMS-2026-CATORGREF001',
        status: 'SUBMITTED',
        priority: 'NORMAL',
        channel: ComplaintChannel.WEB,
        subject: basePayload.subject,
        description: basePayload.description,
        submittedAt: new Date('2026-04-28T10:00:00.000Z'),
        locale: ComplaintLocale.EN,
        consentGiven: true,
        complainantName: null,
        complainantEmail: null,
        complainantPhone: null,
        categoryId: 'cat-active',
        orgUnitId: 'org-active',
      });

      const created = await service.create({
        ...basePayload,
        categoryId: 'cat-active',
        orgUnitId: 'org-active',
      });

      expect(created.complaint.categoryId).toBe('cat-active');
      expect(created.complaint.orgUnitId).toBe('org-active');
      expect(complaintCategoryFindUnique).toHaveBeenCalledWith({
        where: { id: 'cat-active' },
      });
      expect(orgUnitFindUnique).toHaveBeenCalledWith({
        where: { id: 'org-active' },
      });
      expect(complaintCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: 'cat-active',
            orgUnitId: 'org-active',
          }),
        }),
      );
    });
  });
});
