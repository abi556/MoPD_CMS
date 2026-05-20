import { NotFoundException } from '@nestjs/common';
import { ComplaintAccessService } from './complaint-access.service';

describe('ComplaintAccessService', () => {
  const service = new ComplaintAccessService();

  it('scopes list filter to assignee and triage queue for case officer', () => {
    expect(
      service.buildListScopeFilter({
        id: 'user-officer-0001',
        email: 'officer@mopd.local',
        roles: ['CaseOfficer'],
        permissions: ['complaint:read:own', 'complaints:list'],
      }),
    ).toEqual({
      OR: [
        { assignedToUserId: 'user-officer-0001' },
        {
          assignedToUserId: null,
          status: { in: ['SUBMITTED', 'TRIAGE'] },
        },
      ],
    });
  });

  it('does not scope list for complaints admin', () => {
    expect(
      service.buildListScopeFilter({
        id: 'user-complaints-admin-0001',
        email: 'complaints-admin@mopd.local',
        roles: ['ComplaintsAdmin'],
        permissions: ['complaint:read'],
      }),
    ).toEqual({});
  });

  it('returns 404 when officer accesses unassigned complaint', () => {
    expect(() =>
      service.assertCanAccessComplaint(
        {
          id: 'user-officer-0001',
          email: 'officer@mopd.local',
          roles: ['CaseOfficer'],
          permissions: ['complaint:read:own', 'complaints:list'],
        },
        { assignedToUserId: 'user-other' },
      ),
    ).toThrow(NotFoundException);
  });
});
