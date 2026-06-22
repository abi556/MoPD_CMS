import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  evaluateAssign,
  evaluateTransition,
  type ComplaintStatus,
  type ComplaintWorkflowContext,
  type WorkflowDecision,
  type WorkflowDenialDetails,
} from '@mopd-cms/shared';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import type { ComplaintStatusValue } from './dto/complaint-status.enum';

export interface WorkflowForbiddenPayload {
  code: 'workflow_forbidden';
  message: string;
  details: WorkflowDenialDetails;
}

function workflowForbidden(decision: Extract<WorkflowDecision, { allowed: false }>): never {
  const payload: WorkflowForbiddenPayload = {
    code: 'workflow_forbidden',
    message: decision.message,
    details: {
      fromStatus: decision.fromStatus,
      toStatus: decision.toStatus,
      requiredPermissions: decision.requiredPermissions,
      requiredRoles: decision.requiredRoles,
      reasonCode: decision.reasonCode,
    },
  };
  throw new UnprocessableEntityException(payload);
}

function toUserContext(user: JwtUser) {
  return {
    userId: user.id,
    roles: user.roles,
    permissions: user.permissions,
  };
}

function toComplaintContext(complaint: {
  status: string;
  assignedToUserId?: string | null;
}): ComplaintWorkflowContext {
  return {
    status: complaint.status as ComplaintStatus,
    assignedToUserId: complaint.assignedToUserId ?? null,
  };
}

@Injectable()
export class WorkflowPolicyService {
  assertCanAssign(
    user: JwtUser,
    complaint: { status: string; assignedToUserId?: string | null },
    assigneeUserId: string,
  ): void {
    const decision = evaluateAssign(
      toUserContext(user),
      toComplaintContext(complaint),
      assigneeUserId,
    );
    if (!decision.allowed) {
      workflowForbidden(decision);
    }
  }

  assertCanTransition(
    user: JwtUser,
    fromStatus: ComplaintStatusValue,
    toStatus: ComplaintStatusValue,
    complaint?: { status: string; assignedToUserId?: string | null },
  ): void {
    const complaintContext: ComplaintWorkflowContext = complaint
      ? toComplaintContext(complaint)
      : {
          status: fromStatus,
          assignedToUserId: null,
        };

    const decision = evaluateTransition(
      toUserContext(user),
      complaintContext,
      fromStatus,
      toStatus,
    );
    if (!decision.allowed) {
      workflowForbidden(decision);
    }
  }
}
