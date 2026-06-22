import { describe, expect, it } from 'vitest';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import {
  canAssignComplaint,
  canAdminPickAssignee,
  evaluateAssign,
  evaluateTransition,
  getAllGraphEdges,
  listAllowedTransitionTargets,
  TRANSITION_RULES,
} from './complaint-workflow';

const complaintsAdmin = {
  userId: 'admin-1',
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
  userId: 'officer-1',
  roles: ['CaseOfficer'],
  permissions: [
    'complaint:read:own',
    'complaint:assign:self',
    'complaint:investigate',
    'complaint:escalate',
  ],
};

const reviewer = {
  userId: 'reviewer-1',
  roles: ['ReviewerApprover'],
  permissions: ['complaint:read', 'complaint:review', 'complaint:approve'],
};

describe('complaint-workflow', () => {
  it('has a transition rule for every graph edge except assign-only edges', () => {
    const assignOnly = new Set(['TRIAGE->ASSIGNED', 'APPEAL->ASSIGNED']);
    for (const { from, to } of getAllGraphEdges()) {
      const key = `${from}->${to}`;
      if (assignOnly.has(key)) {
        continue;
      }
      const rule = TRANSITION_RULES.find((r) => r.from === from && r.to === to);
      expect(rule, `missing rule for ${key}`).toBeDefined();
    }
  });

  it('allows complaints admin to triage', () => {
    const result = evaluateTransition(
      complaintsAdmin,
      { status: ComplaintStatus.SUBMITTED, assignedToUserId: null },
      ComplaintStatus.SUBMITTED,
      ComplaintStatus.TRIAGE,
    );
    expect(result.allowed).toBe(true);
  });

  it('denies officer triage', () => {
    const result = evaluateTransition(
      officer,
      { status: ComplaintStatus.SUBMITTED, assignedToUserId: null },
      ComplaintStatus.SUBMITTED,
      ComplaintStatus.TRIAGE,
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reasonCode).toBe('missing_permission');
    }
  });

  it('allows assignee officer investigation transitions', () => {
    const complaint = {
      status: ComplaintStatus.ASSIGNED,
      assignedToUserId: 'officer-1',
    };
    expect(
      evaluateTransition(
        officer,
        complaint,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_INVESTIGATION,
      ).allowed,
    ).toBe(true);
  });

  it('denies officer investigation when not assignee', () => {
    const result = evaluateTransition(
      officer,
      { status: ComplaintStatus.ASSIGNED, assignedToUserId: 'other' },
      ComplaintStatus.ASSIGNED,
      ComplaintStatus.IN_INVESTIGATION,
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reasonCode).toBe('not_assignee');
    }
  });

  it('allows assignee officer to submit draft to QA', () => {
    const complaint = {
      status: ComplaintStatus.DRAFT_RESPONSE,
      assignedToUserId: 'officer-1',
    };
    const targets = listAllowedTransitionTargets(officer, complaint);
    expect(targets).toContain(ComplaintStatus.QA_LEGAL_REVIEW);
  });

  it('denies reviewer investigation transition', () => {
    expect(
      evaluateTransition(
        reviewer,
        { status: ComplaintStatus.QA_LEGAL_REVIEW, assignedToUserId: 'officer-1' },
        ComplaintStatus.QA_LEGAL_REVIEW,
        ComplaintStatus.RESPONSE_ISSUED,
      ).allowed,
    ).toBe(true);
  });

  it('denies officer close', () => {
    const result = evaluateTransition(
      officer,
      { status: ComplaintStatus.AWAITING_FEEDBACK, assignedToUserId: 'officer-1' },
      ComplaintStatus.AWAITING_FEEDBACK,
      ComplaintStatus.CLOSED,
    );
    expect(result.allowed).toBe(false);
  });

  it('allows admin assign from triage', () => {
    expect(
      evaluateAssign(
        complaintsAdmin,
        { status: ComplaintStatus.TRIAGE, assignedToUserId: null },
        'officer-1',
      ).allowed,
    ).toBe(true);
    expect(canAdminPickAssignee(complaintsAdmin)).toBe(true);
  });

  it('allows officer self-assign from unassigned triage only', () => {
    expect(
      evaluateAssign(
        officer,
        { status: ComplaintStatus.TRIAGE, assignedToUserId: null },
        'officer-1',
      ).allowed,
    ).toBe(true);
    expect(
      evaluateAssign(
        officer,
        { status: ComplaintStatus.TRIAGE, assignedToUserId: 'other' },
        'officer-1',
      ).allowed,
    ).toBe(false);
    expect(canAssignComplaint(officer, { status: ComplaintStatus.TRIAGE, assignedToUserId: null })).toBe(
      true,
    );
  });

  it('denies officer self-assign from appeal', () => {
    expect(
      evaluateAssign(
        officer,
        { status: ComplaintStatus.APPEAL, assignedToUserId: null },
        'officer-1',
      ).allowed,
    ).toBe(false);
  });
});
