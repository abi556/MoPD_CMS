import { UnprocessableEntityException } from '@nestjs/common';
import { ComplaintStatusValue } from './dto/complaint-status.enum';
import { WorkflowPolicyService } from './workflow-policy.service';

describe('WorkflowPolicyService', () => {
  const service = new WorkflowPolicyService();

  const complaintsAdmin = {
    id: 'admin-1',
    email: 'complaints-admin@mopd.local',
    roles: ['ComplaintsAdmin'],
    permissions: [
      'complaint:triage',
      'complaint:assign',
      'complaint:close',
      'complaint:publish',
      'complaint:escalate',
      'complaint:read',
    ],
  };

  const officer = {
    id: 'officer-1',
    email: 'officer@mopd.local',
    roles: ['CaseOfficer'],
    permissions: [
      'complaint:read:own',
      'complaint:assign:self',
      'complaint:investigate',
    ],
  };

  const reviewer = {
    id: 'reviewer-1',
    email: 'reviewer@mopd.local',
    roles: ['ReviewerApprover'],
    permissions: ['complaint:read', 'complaint:review', 'complaint:approve'],
  };

  const triageComplaint = {
    status: ComplaintStatusValue.TRIAGE,
    assignedToUserId: null,
  };

  const assignedComplaint = {
    status: ComplaintStatusValue.ASSIGNED,
    assignedToUserId: 'officer-1',
  };

  it('allows complaints admin to triage', () => {
    expect(() =>
      service.assertCanTransition(
        complaintsAdmin,
        ComplaintStatusValue.SUBMITTED,
        ComplaintStatusValue.TRIAGE,
        { status: ComplaintStatusValue.SUBMITTED, assignedToUserId: null },
      ),
    ).not.toThrow();
  });

  it('denies officer triage with structured workflow_forbidden', () => {
    try {
      service.assertCanTransition(
        officer,
        ComplaintStatusValue.SUBMITTED,
        ComplaintStatusValue.TRIAGE,
        { status: ComplaintStatusValue.SUBMITTED, assignedToUserId: null },
      );
      throw new Error('expected workflow_forbidden');
    } catch (err) {
      expect(err).toBeInstanceOf(UnprocessableEntityException);
      const response = (err as UnprocessableEntityException).getResponse() as {
        code: string;
        details: { reasonCode: string };
      };
      expect(response.code).toBe('workflow_forbidden');
      expect(response.details.reasonCode).toBe('missing_permission');
    }
  });

  it('allows assignee officer investigation transition', () => {
    expect(() =>
      service.assertCanTransition(
        officer,
        ComplaintStatusValue.ASSIGNED,
        ComplaintStatusValue.IN_INVESTIGATION,
        assignedComplaint,
      ),
    ).not.toThrow();
  });

  it('denies officer close', () => {
    expect(() =>
      service.assertCanTransition(
        officer,
        ComplaintStatusValue.AWAITING_FEEDBACK,
        ComplaintStatusValue.CLOSED,
        {
          status: ComplaintStatusValue.AWAITING_FEEDBACK,
          assignedToUserId: 'officer-1',
        },
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('allows reviewer approve from QA', () => {
    expect(() =>
      service.assertCanTransition(
        reviewer,
        ComplaintStatusValue.QA_LEGAL_REVIEW,
        ComplaintStatusValue.RESPONSE_ISSUED,
        {
          status: ComplaintStatusValue.QA_LEGAL_REVIEW,
          assignedToUserId: 'officer-1',
        },
      ),
    ).not.toThrow();
  });

  it('allows admin assign to any officer from triage', () => {
    expect(() =>
      service.assertCanAssign(complaintsAdmin, triageComplaint, 'officer-1'),
    ).not.toThrow();
  });

  it('allows officer self-assign from unassigned triage', () => {
    expect(() =>
      service.assertCanAssign(officer, triageComplaint, 'officer-1'),
    ).not.toThrow();
  });

  it('denies officer assigning another user', () => {
    expect(() =>
      service.assertCanAssign(officer, triageComplaint, 'other-officer'),
    ).toThrow(UnprocessableEntityException);
  });
});
