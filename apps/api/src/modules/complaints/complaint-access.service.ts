import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import {
  hasComplaintReadAll,
  shouldScopeComplaintsToAssignee,
} from '../auth/rbac/permission-check';
import { ComplaintStatusValue } from './dto/complaint-status.enum';

const QUEUE_STATUSES: ComplaintStatusValue[] = [
  ComplaintStatusValue.SUBMITTED,
  ComplaintStatusValue.TRIAGE,
];

export interface ComplaintScopeRow {
  assignedToUserId: string | null;
  status: string;
}

export type ComplaintListScopeFilter =
  | Record<string, never>
  | { assignedToUserId: string }
  | {
      OR: Array<
        | { assignedToUserId: string }
        | {
            assignedToUserId: null;
            status: { in: ComplaintStatusValue[] };
          }
      >;
    };

@Injectable()
export class ComplaintAccessService {
  buildListScopeFilter(user: JwtUser): ComplaintListScopeFilter {
    if (!shouldScopeComplaintsToAssignee(user)) {
      return {};
    }
    return {
      OR: [
        { assignedToUserId: user.id },
        {
          assignedToUserId: null,
          status: { in: QUEUE_STATUSES },
        },
      ],
    };
  }

  assertCanAccessComplaint(user: JwtUser, complaint: ComplaintScopeRow): void {
    if (hasComplaintReadAll(user)) {
      return;
    }
    if (!shouldScopeComplaintsToAssignee(user)) {
      throw new NotFoundException('Complaint not found');
    }
    if (complaint.assignedToUserId === user.id) {
      return;
    }
    if (
      complaint.assignedToUserId === null &&
      QUEUE_STATUSES.includes(complaint.status as ComplaintStatusValue)
    ) {
      return;
    }
    throw new NotFoundException('Complaint not found');
  }
}
