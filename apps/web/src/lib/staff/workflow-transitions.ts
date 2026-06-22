import {
  canAdminPickAssignee,
  canAssignComplaint,
  canSelfAssignOnly,
  ComplaintStatus,
  listAllowedTransitionTargets,
  type ComplaintWorkflowContext,
  type WorkflowUserContext,
} from '@mopd-cms/shared';
import type { ComplaintStatus as UiComplaintStatus } from '@/components/ui/status-badge';

export type { ComplaintStatus as WorkflowComplaintStatus } from '@mopd-cms/shared';

function toWorkflowStatus(status: UiComplaintStatus): ComplaintStatus {
  return status as ComplaintStatus;
}

function buildUserContext(
  userId: string,
  permissions: readonly string[],
  roles: readonly string[] = [],
): WorkflowUserContext {
  return { userId, permissions, roles };
}

function buildComplaintContext(
  status: UiComplaintStatus,
  assignedToUserId?: string | null,
): ComplaintWorkflowContext {
  return {
    status: toWorkflowStatus(status),
    assignedToUserId: assignedToUserId ?? null,
  };
}

export function getAllowedTransitions(
  fromStatus: UiComplaintStatus,
  permissions: readonly string[],
  options?: {
    userId?: string;
    roles?: readonly string[];
    assignedToUserId?: string | null;
  },
): UiComplaintStatus[] {
  const user = buildUserContext(
    options?.userId ?? '',
    permissions,
    options?.roles ?? [],
  );
  const complaint = buildComplaintContext(
    fromStatus,
    options?.assignedToUserId,
  );
  return listAllowedTransitionTargets(user, complaint) as UiComplaintStatus[];
}

export function canAssign(
  permissions: readonly string[],
  options?: {
    userId?: string;
    roles?: readonly string[];
    status?: UiComplaintStatus;
    assignedToUserId?: string | null;
  },
): boolean {
  if (!options?.status) {
    return (
      canAdminPickAssignee(
        buildUserContext(options?.userId ?? '', permissions, options?.roles),
      ) ||
      canSelfAssignOnly(
        buildUserContext(options?.userId ?? '', permissions, options?.roles),
      )
    );
  }
  return canAssignComplaint(
    buildUserContext(options.userId ?? '', permissions, options.roles),
    buildComplaintContext(options.status, options.assignedToUserId),
  );
}

export function canAssignFromStatus(status: UiComplaintStatus): boolean {
  return status === 'TRIAGE' || status === 'APPEAL';
}

export function canPickAssigneeUser(
  permissions: readonly string[],
  options?: { userId?: string; roles?: readonly string[] },
): boolean {
  return canAdminPickAssignee(
    buildUserContext(options?.userId ?? '', permissions, options?.roles),
  );
}

export function isSelfAssignOnly(
  permissions: readonly string[],
  options?: { userId?: string; roles?: readonly string[] },
): boolean {
  return canSelfAssignOnly(
    buildUserContext(options?.userId ?? '', permissions, options?.roles),
  );
}
