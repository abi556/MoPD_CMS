import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { hasPermission } from '../auth/rbac/permission-check';
import { ComplaintStatusValue } from './dto/complaint-status.enum';

function workflowForbidden(message: string): never {
  throw new UnprocessableEntityException({
    code: 'workflow_forbidden',
    message,
  });
}

@Injectable()
export class WorkflowPolicyService {
  assertCanAssign(user: JwtUser): void {
    if (user.roles.includes('SuperAdmin')) {
      return;
    }
    if (
      hasPermission(user, 'workflow:transition') ||
      hasPermission(user, 'complaints:assign')
    ) {
      return;
    }
    workflowForbidden('You are not allowed to assign complaints.');
  }

  assertCanTransition(
    user: JwtUser,
    fromStatus: ComplaintStatusValue,
    toStatus: ComplaintStatusValue,
  ): void {
    if (user.roles.includes('SuperAdmin')) {
      return;
    }

    if (toStatus === ComplaintStatusValue.QA_LEGAL_REVIEW) {
      if (!hasPermission(user, 'complaint:review')) {
        workflowForbidden(
          'Transition to QA/legal review requires complaint:review permission.',
        );
      }
    }

    if (
      fromStatus === ComplaintStatusValue.QA_LEGAL_REVIEW &&
      toStatus === ComplaintStatusValue.RESPONSE_ISSUED
    ) {
      if (!hasPermission(user, 'complaint:approve')) {
        workflowForbidden(
          'Issuing a response from QA review requires complaint:approve permission.',
        );
      }
    }

    if (toStatus === ComplaintStatusValue.APPEAL) {
      if (!hasPermission(user, 'complaint:escalate')) {
        workflowForbidden(
          'Opening an appeal requires complaint:escalate permission.',
        );
      }
    }

    if (
      toStatus === ComplaintStatusValue.ASSIGNED ||
      fromStatus === ComplaintStatusValue.TRIAGE
    ) {
      if (
        !hasPermission(user, 'workflow:transition') &&
        !hasPermission(user, 'complaints:transition') &&
        !hasPermission(user, 'complaints:assign')
      ) {
        workflowForbidden('You are not allowed to perform this transition.');
      }
    }
  }
}
