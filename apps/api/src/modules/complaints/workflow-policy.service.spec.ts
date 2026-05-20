import { UnprocessableEntityException } from '@nestjs/common';
import { ComplaintStatusValue } from './dto/complaint-status.enum';
import { WorkflowPolicyService } from './workflow-policy.service';

describe('WorkflowPolicyService', () => {
  const service = new WorkflowPolicyService();

  const reviewer = {
    id: 'user-reviewer-0001',
    email: 'reviewer@mopd.local',
    roles: ['ReviewerApprover'],
    permissions: [
      'complaint:review',
      'complaint:approve',
      'workflow:transition',
    ],
  };

  const officer = {
    id: 'user-officer-0001',
    email: 'officer@mopd.local',
    roles: ['CaseOfficer'],
    permissions: ['complaints:transition', 'workflow:transition'],
  };

  it('allows reviewer to transition into QA review', () => {
    expect(() =>
      service.assertCanTransition(
        reviewer,
        ComplaintStatusValue.DRAFT_RESPONSE,
        ComplaintStatusValue.QA_LEGAL_REVIEW,
      ),
    ).not.toThrow();
  });

  it('denies officer transition into QA without complaint:review', () => {
    expect(() =>
      service.assertCanTransition(
        officer,
        ComplaintStatusValue.DRAFT_RESPONSE,
        ComplaintStatusValue.QA_LEGAL_REVIEW,
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('allows reviewer with approve permission to issue response', () => {
    expect(() =>
      service.assertCanTransition(
        reviewer,
        ComplaintStatusValue.QA_LEGAL_REVIEW,
        ComplaintStatusValue.RESPONSE_ISSUED,
      ),
    ).not.toThrow();
  });
});
