import { ComplaintStatus } from '../enums/complaint-status.enum';
import {
  hasAdminAssignOverride,
  hasAnyWorkflowPermission,
  hasWorkflowPermission,
} from './permission-utils';

export type WorkflowReasonCode =
  | 'missing_permission'
  | 'not_assignee'
  | 'self_assign_not_allowed'
  | 'already_assigned'
  | 'invalid_status'
  | 'invalid_transition';

export interface WorkflowUserContext {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
}

export interface ComplaintWorkflowContext {
  status: ComplaintStatus;
  assignedToUserId: string | null;
}

export interface WorkflowDenialDetails {
  fromStatus: ComplaintStatus;
  toStatus?: ComplaintStatus;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  reasonCode: WorkflowReasonCode;
}

export type WorkflowDecision =
  | { allowed: true }
  | ({ allowed: false; message: string } & WorkflowDenialDetails);

interface PermissionAlternative {
  permissions: readonly string[];
  assigneeOnly?: boolean;
}

interface TransitionRule {
  from: ComplaintStatus;
  to: ComplaintStatus;
  alternatives: readonly PermissionAlternative[];
  requiredRoles?: readonly string[];
}

export const COMPLAINT_STATUS_GRAPH: Record<
  ComplaintStatus,
  readonly ComplaintStatus[]
> = {
  [ComplaintStatus.SUBMITTED]: [ComplaintStatus.TRIAGE],
  [ComplaintStatus.TRIAGE]: [ComplaintStatus.ASSIGNED],
  [ComplaintStatus.ASSIGNED]: [ComplaintStatus.IN_INVESTIGATION],
  [ComplaintStatus.IN_INVESTIGATION]: [ComplaintStatus.DRAFT_RESPONSE],
  [ComplaintStatus.DRAFT_RESPONSE]: [ComplaintStatus.QA_LEGAL_REVIEW],
  [ComplaintStatus.QA_LEGAL_REVIEW]: [
    ComplaintStatus.DRAFT_RESPONSE,
    ComplaintStatus.RESPONSE_ISSUED,
  ],
  [ComplaintStatus.RESPONSE_ISSUED]: [ComplaintStatus.AWAITING_FEEDBACK],
  [ComplaintStatus.AWAITING_FEEDBACK]: [
    ComplaintStatus.CLOSED,
    ComplaintStatus.APPEAL,
  ],
  [ComplaintStatus.APPEAL]: [ComplaintStatus.ASSIGNED],
  [ComplaintStatus.CLOSED]: [],
};

export const TRANSITION_RULES: readonly TransitionRule[] = [
  {
    from: ComplaintStatus.SUBMITTED,
    to: ComplaintStatus.TRIAGE,
    alternatives: [{ permissions: ['complaint:triage'] }],
    requiredRoles: ['ComplaintsAdmin'],
  },
  {
    from: ComplaintStatus.ASSIGNED,
    to: ComplaintStatus.IN_INVESTIGATION,
    alternatives: [{ permissions: ['complaint:investigate'], assigneeOnly: true }],
    requiredRoles: ['CaseOfficer'],
  },
  {
    from: ComplaintStatus.IN_INVESTIGATION,
    to: ComplaintStatus.DRAFT_RESPONSE,
    alternatives: [{ permissions: ['complaint:investigate'], assigneeOnly: true }],
    requiredRoles: ['CaseOfficer'],
  },
  {
    from: ComplaintStatus.DRAFT_RESPONSE,
    to: ComplaintStatus.QA_LEGAL_REVIEW,
    alternatives: [{ permissions: ['complaint:investigate'], assigneeOnly: true }],
    requiredRoles: ['CaseOfficer'],
  },
  {
    from: ComplaintStatus.QA_LEGAL_REVIEW,
    to: ComplaintStatus.DRAFT_RESPONSE,
    alternatives: [{ permissions: ['complaint:review'] }],
    requiredRoles: ['ReviewerApprover'],
  },
  {
    from: ComplaintStatus.QA_LEGAL_REVIEW,
    to: ComplaintStatus.RESPONSE_ISSUED,
    alternatives: [{ permissions: ['complaint:approve'] }],
    requiredRoles: ['ReviewerApprover'],
  },
  {
    from: ComplaintStatus.RESPONSE_ISSUED,
    to: ComplaintStatus.AWAITING_FEEDBACK,
    alternatives: [
      { permissions: ['complaint:publish'] },
      { permissions: ['complaint:investigate'], assigneeOnly: true },
    ],
    requiredRoles: ['ComplaintsAdmin', 'CaseOfficer'],
  },
  {
    from: ComplaintStatus.AWAITING_FEEDBACK,
    to: ComplaintStatus.CLOSED,
    alternatives: [{ permissions: ['complaint:close'] }],
    requiredRoles: ['ComplaintsAdmin'],
  },
  {
    from: ComplaintStatus.AWAITING_FEEDBACK,
    to: ComplaintStatus.APPEAL,
    alternatives: [{ permissions: ['complaint:escalate'] }],
    requiredRoles: ['ComplaintsAdmin', 'Ombudsperson'],
  },
];

const ASSIGNABLE_STATUSES: readonly ComplaintStatus[] = [
  ComplaintStatus.TRIAGE,
  ComplaintStatus.APPEAL,
];

function isSuperAdmin(user: WorkflowUserContext): boolean {
  return user.roles.includes('SuperAdmin');
}

function isAssignee(
  user: WorkflowUserContext,
  complaint: ComplaintWorkflowContext,
): boolean {
  return (
    complaint.assignedToUserId !== null &&
    complaint.assignedToUserId === user.userId
  );
}

function getTransitionRule(
  from: ComplaintStatus,
  to: ComplaintStatus,
): TransitionRule | undefined {
  return TRANSITION_RULES.find((rule) => rule.from === from && rule.to === to);
}

function alternativePasses(
  user: WorkflowUserContext,
  complaint: ComplaintWorkflowContext,
  alternative: PermissionAlternative,
): boolean {
  if (!hasAnyWorkflowPermission(user.permissions, alternative.permissions)) {
    return false;
  }
  if (alternative.assigneeOnly && !hasAdminAssignOverride(user.permissions)) {
    return isAssignee(user, complaint);
  }
  return true;
}

function deny(
  message: string,
  details: WorkflowDenialDetails,
): WorkflowDecision {
  return { allowed: false, message, ...details };
}

export function isValidGraphTransition(
  from: ComplaintStatus,
  to: ComplaintStatus,
): boolean {
  return COMPLAINT_STATUS_GRAPH[from]?.includes(to) ?? false;
}

export function evaluateTransition(
  user: WorkflowUserContext,
  complaint: ComplaintWorkflowContext,
  from: ComplaintStatus,
  to: ComplaintStatus,
): WorkflowDecision {
  if (isSuperAdmin(user)) {
    return { allowed: true };
  }

  if (!isValidGraphTransition(from, to)) {
    return deny(`Invalid transition from ${from} to ${to}.`, {
      fromStatus: from,
      toStatus: to,
      reasonCode: 'invalid_transition',
    });
  }

  const rule = getTransitionRule(from, to);
  if (!rule) {
    return deny(`No workflow rule for transition from ${from} to ${to}.`, {
      fromStatus: from,
      toStatus: to,
      reasonCode: 'invalid_transition',
    });
  }

  const passes = rule.alternatives.some((alt) =>
    alternativePasses(user, complaint, alt),
  );

  if (passes) {
    return { allowed: true };
  }

  const assigneeBlocked = rule.alternatives.some(
    (alt) =>
      alt.assigneeOnly &&
      hasAnyWorkflowPermission(user.permissions, alt.permissions) &&
      !isAssignee(user, complaint) &&
      !hasAdminAssignOverride(user.permissions),
  );

  if (assigneeBlocked) {
    return deny(
      'This workflow step must be performed by the assigned case officer.',
      {
        fromStatus: from,
        toStatus: to,
        requiredPermissions: [...rule.alternatives.flatMap((a) => a.permissions)],
        requiredRoles: rule.requiredRoles ? [...rule.requiredRoles] : undefined,
        reasonCode: 'not_assignee',
      },
    );
  }

  return deny(
    `You are not allowed to transition from ${from} to ${to}.`,
    {
      fromStatus: from,
      toStatus: to,
      requiredPermissions: [...rule.alternatives.flatMap((a) => a.permissions)],
      requiredRoles: rule.requiredRoles ? [...rule.requiredRoles] : undefined,
      reasonCode: 'missing_permission',
    },
  );
}

export function evaluateAssign(
  user: WorkflowUserContext,
  complaint: ComplaintWorkflowContext,
  assigneeUserId: string,
): WorkflowDecision {
  if (isSuperAdmin(user)) {
    return { allowed: true };
  }

  const status = complaint.status;

  if (!ASSIGNABLE_STATUSES.includes(status)) {
    return deny(
      `Assignment is not allowed from status ${status}.`,
      {
        fromStatus: status,
        reasonCode: 'invalid_status',
        requiredPermissions: ['complaint:assign'],
        requiredRoles: ['ComplaintsAdmin'],
      },
    );
  }

  if (status === ComplaintStatus.APPEAL) {
    if (!hasWorkflowPermission(user.permissions, 'complaint:assign')) {
      return deny(
        'Reassignment after appeal requires Complaints Admin.',
        {
          fromStatus: status,
          reasonCode: 'missing_permission',
          requiredPermissions: ['complaint:assign'],
          requiredRoles: ['ComplaintsAdmin'],
        },
      );
    }
    return { allowed: true };
  }

  // TRIAGE
  if (hasWorkflowPermission(user.permissions, 'complaint:assign')) {
    return { allowed: true };
  }

  if (hasWorkflowPermission(user.permissions, 'complaint:assign:self')) {
    if (complaint.assignedToUserId !== null) {
      return deny(
        'This case is already assigned. Contact Complaints Admin to reassign.',
        {
          fromStatus: status,
          reasonCode: 'already_assigned',
          requiredPermissions: ['complaint:assign'],
          requiredRoles: ['ComplaintsAdmin'],
        },
      );
    }
    if (assigneeUserId !== user.userId) {
      return deny(
        'You may only assign unassigned triage cases to yourself.',
        {
          fromStatus: status,
          reasonCode: 'self_assign_not_allowed',
          requiredPermissions: ['complaint:assign:self'],
          requiredRoles: ['CaseOfficer'],
        },
      );
    }
    return { allowed: true };
  }

  return deny('You are not allowed to assign complaints.', {
    fromStatus: status,
    reasonCode: 'missing_permission',
    requiredPermissions: ['complaint:assign', 'complaint:assign:self'],
    requiredRoles: ['ComplaintsAdmin', 'CaseOfficer'],
  });
}

export function listAllowedTransitionTargets(
  user: WorkflowUserContext,
  complaint: ComplaintWorkflowContext,
): ComplaintStatus[] {
  const from = complaint.status;
  const candidates = COMPLAINT_STATUS_GRAPH[from] ?? [];

  return candidates.filter((to) => {
    if (
      to === ComplaintStatus.ASSIGNED &&
      (from === ComplaintStatus.TRIAGE || from === ComplaintStatus.APPEAL)
    ) {
      return false;
    }
    if (to === ComplaintStatus.APPEAL && from === ComplaintStatus.AWAITING_FEEDBACK) {
      return false;
    }
    return evaluateTransition(user, complaint, from, to).allowed;
  });
}

export function canAssignComplaint(
  user: WorkflowUserContext,
  complaint: ComplaintWorkflowContext,
): boolean {
  if (!ASSIGNABLE_STATUSES.includes(complaint.status)) {
    return false;
  }
  if (isSuperAdmin(user)) {
    return true;
  }
  if (hasWorkflowPermission(user.permissions, 'complaint:assign')) {
    return true;
  }
  if (
    complaint.status === ComplaintStatus.TRIAGE &&
    hasWorkflowPermission(user.permissions, 'complaint:assign:self') &&
    complaint.assignedToUserId === null
  ) {
    return true;
  }
  return false;
}

export function canAdminPickAssignee(user: WorkflowUserContext): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }
  return hasWorkflowPermission(user.permissions, 'complaint:assign');
}

export function canSelfAssignOnly(user: WorkflowUserContext): boolean {
  if (isSuperAdmin(user) || canAdminPickAssignee(user)) {
    return false;
  }
  return hasWorkflowPermission(user.permissions, 'complaint:assign:self');
}

export function getAllGraphEdges(): Array<{
  from: ComplaintStatus;
  to: ComplaintStatus;
}> {
  return Object.entries(COMPLAINT_STATUS_GRAPH).flatMap(([from, targets]) =>
    targets.map((to) => ({
      from: from as ComplaintStatus,
      to,
    })),
  );
}
