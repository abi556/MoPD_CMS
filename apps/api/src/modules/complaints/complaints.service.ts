import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  Complaint as ComplaintEntity,
  ComplaintHistory as ComplaintHistoryEntity,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ComplaintChannel,
  ComplaintLocale,
  CreateComplaintDto,
} from './dto/create-complaint.dto';
import { ComplaintStatusValue } from './dto/complaint-status.enum';
import { ListComplaintsQueryDto } from './dto/list-complaints.dto';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { SlaService } from '../sla/sla.service';

export interface ComplaintRecord {
  id: string;
  referenceNo: string;
  status: ComplaintStatusValue;
  channel: ComplaintChannel;
  subject: string;
  description: string;
  submittedAt: string;
  locale: ComplaintLocale;
  consentGiven: boolean;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  assignedToUserId?: string;
  assignedByUserId?: string;
  assignedAt?: string;
  assignmentReason?: string;
  lastTransitionByUserId?: string;
  lastTransitionAt?: string;
  lastTransitionReason?: string;
}

export interface ComplaintListResult {
  data: ComplaintRecord[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ComplaintHistoryRecord {
  id: string;
  complaintId: string;
  action: 'ASSIGNED' | 'TRANSITIONED';
  fromStatus: ComplaintStatusValue | null;
  toStatus: ComplaintStatusValue;
  actorUserId: string;
  reason?: string;
  createdAt: string;
}

@Injectable()
export class ComplaintsService {
  private readonly allowedTransitions: Record<
    ComplaintStatusValue,
    ComplaintStatusValue[]
  > = {
    [ComplaintStatusValue.SUBMITTED]: [ComplaintStatusValue.TRIAGE],
    [ComplaintStatusValue.TRIAGE]: [ComplaintStatusValue.ASSIGNED],
    [ComplaintStatusValue.ASSIGNED]: [ComplaintStatusValue.IN_INVESTIGATION],
    [ComplaintStatusValue.IN_INVESTIGATION]: [
      ComplaintStatusValue.DRAFT_RESPONSE,
    ],
    [ComplaintStatusValue.DRAFT_RESPONSE]: [
      ComplaintStatusValue.QA_LEGAL_REVIEW,
    ],
    [ComplaintStatusValue.QA_LEGAL_REVIEW]: [
      ComplaintStatusValue.DRAFT_RESPONSE,
      ComplaintStatusValue.RESPONSE_ISSUED,
    ],
    [ComplaintStatusValue.RESPONSE_ISSUED]: [
      ComplaintStatusValue.AWAITING_FEEDBACK,
    ],
    [ComplaintStatusValue.AWAITING_FEEDBACK]: [
      ComplaintStatusValue.CLOSED,
      ComplaintStatusValue.APPEAL,
    ],
    [ComplaintStatusValue.APPEAL]: [ComplaintStatusValue.ASSIGNED],
    [ComplaintStatusValue.CLOSED]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => SlaService))
    private readonly slaService: SlaService,
  ) {}

  async create(
    payload: CreateComplaintDto,
    correlationId?: string,
  ): Promise<ComplaintRecord> {
    const created = await this.prisma.$transaction(async (tx) => {
      const inserted = await tx.complaint.create({
        data: {
          referenceNo: `TMP-${randomUUID()}`,
          status: ComplaintStatusValue.SUBMITTED,
          channel: payload.channel,
          subject: payload.subject,
          description: payload.description,
          locale: payload.locale,
          consentGiven: payload.consentGiven,
          complainantName: payload.complainantName,
          complainantEmail: payload.complainantEmail,
          complainantPhone: payload.complainantPhone,
        },
      });

      const referenceNo = this.buildReferenceNo(
        inserted.submittedAt,
        inserted.sequenceNo,
      );

      return tx.complaint.update({
        where: { id: inserted.id },
        data: { referenceNo },
      });
    });

    const record = this.toComplaintRecord(created);

    // Start SLA tracker after complaint is persisted (best-effort — never block intake)
    await this.slaService
      .startTrackerForComplaint(
        record.id,
        created.priority,
        created.categoryId ?? null,
        correlationId,
      )
      .catch((err: unknown) => {
        // Log but do not fail the request if SLA setup fails
        void err;
      });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_CREATED,
      entityType: 'complaint',
      entityId: record.id,
      correlationId,
      metadata: {
        referenceNo: record.referenceNo,
        channel: record.channel,
        locale: record.locale,
      },
    });
    return record;
  }

  async getByReference(referenceNo: string): Promise<ComplaintRecord> {
    const found = await this.prisma.complaint.findUnique({
      where: { referenceNo },
    });

    if (!found) {
      throw new NotFoundException('Complaint not found');
    }

    return this.toComplaintRecord(found);
  }

  async getByIdForStaff(id: string): Promise<ComplaintRecord> {
    const found = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!found) {
      throw new NotFoundException('Complaint not found');
    }

    return this.toComplaintRecord(found);
  }

  async assignComplaint(
    id: string,
    assigneeUserId: string,
    assignedByUserId: string,
    reason?: string,
    correlationId?: string,
  ): Promise<ComplaintRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.complaint.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Complaint not found');
      }
      const currentStatus = existing.status as ComplaintStatusValue;
      if (
        currentStatus !== ComplaintStatusValue.TRIAGE &&
        currentStatus !== ComplaintStatusValue.APPEAL
      ) {
        throw new UnprocessableEntityException(
          `Invalid assignment from ${currentStatus}. Assignment requires TRIAGE or APPEAL.`,
        );
      }

      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          status: ComplaintStatusValue.ASSIGNED,
          assignedToUserId: assigneeUserId,
          assignedByUserId,
          assignedAt: new Date(),
          assignmentReason: reason ?? null,
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          action: 'ASSIGNED',
          fromStatus: currentStatus,
          toStatus: ComplaintStatusValue.ASSIGNED,
          actorUserId: assignedByUserId,
          reason: reason ?? null,
        },
      });

      return updatedComplaint;
    });

    const record = this.toComplaintRecord(updated);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_ASSIGNED,
      actorUserId: assignedByUserId,
      entityType: 'complaint',
      entityId: id,
      correlationId,
      metadata: {
        assigneeUserId,
        reason: reason ?? null,
        status: record.status,
      },
    });
    return record;
  }

  async transitionComplaint(
    id: string,
    toStatus: ComplaintStatusValue,
    transitionedByUserId: string,
    reason: string,
    correlationId?: string,
  ): Promise<ComplaintRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.complaint.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Complaint not found');
      }

      const fromStatus = existing.status as ComplaintStatusValue;
      const allowedNext = this.allowedTransitions[fromStatus] ?? [];

      if (!allowedNext.includes(toStatus)) {
        throw new UnprocessableEntityException(
          `Invalid transition from ${fromStatus} to ${toStatus}`,
        );
      }

      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          status: toStatus,
          lastTransitionByUserId: transitionedByUserId,
          lastTransitionAt: new Date(),
          lastTransitionReason: reason,
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          action: 'TRANSITIONED',
          fromStatus,
          toStatus,
          actorUserId: transitionedByUserId,
          reason,
        },
      });

      return updatedComplaint;
    });

    const record = this.toComplaintRecord(updated);

    // Complete SLA tracker when complaint reaches CLOSED
    if (toStatus === ComplaintStatusValue.CLOSED) {
      await this.slaService
        .completeTracker(id, reason, correlationId)
        .catch((err: unknown) => {
          void err;
        });
    }

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_TRANSITIONED,
      actorUserId: transitionedByUserId,
      entityType: 'complaint',
      entityId: id,
      correlationId,
      metadata: {
        toStatus,
        reason,
      },
    });
    return record;
  }

  async getHistoryForStaff(id: string): Promise<ComplaintHistoryRecord[]> {
    const exists = await this.prisma.complaint.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Complaint not found');
    }

    const rows = await this.prisma.complaintHistory.findMany({
      where: { complaintId: id },
      orderBy: [{ createdAt: 'asc' }],
    });

    return rows.map((row) => this.toHistoryRecord(row));
  }

  async listForStaff(
    query: ListComplaintsQueryDto,
  ): Promise<ComplaintListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      status: query.status,
      channel: query.channel,
      locale: query.locale,
      submittedAt:
        query.submittedFrom || query.submittedTo
          ? {
              gte: query.submittedFrom
                ? new Date(query.submittedFrom)
                : undefined,
              lte: query.submittedTo ? new Date(query.submittedTo) : undefined,
            }
          : undefined,
    };

    const [rows, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: [{ submittedAt: 'desc' }, { sequenceNo: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toComplaintRecord(row)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  private buildReferenceNo(submittedAt: Date, sequenceNo: number): string {
    const year = submittedAt.getUTCFullYear();
    const serial = String(sequenceNo).padStart(6, '0');
    return `CMS-${year}-${serial}`;
  }

  private toComplaintRecord(complaint: ComplaintEntity): ComplaintRecord {
    return {
      id: complaint.id,
      referenceNo: complaint.referenceNo,
      status: complaint.status as ComplaintStatusValue,
      channel: complaint.channel as ComplaintChannel,
      subject: complaint.subject,
      description: complaint.description,
      submittedAt: complaint.submittedAt.toISOString(),
      locale: complaint.locale as ComplaintLocale,
      consentGiven: complaint.consentGiven,
      complainantName: complaint.complainantName ?? undefined,
      complainantEmail: complaint.complainantEmail ?? undefined,
      complainantPhone: complaint.complainantPhone ?? undefined,
      assignedToUserId: complaint.assignedToUserId ?? undefined,
      assignedByUserId: complaint.assignedByUserId ?? undefined,
      assignedAt: complaint.assignedAt?.toISOString(),
      assignmentReason: complaint.assignmentReason ?? undefined,
      lastTransitionByUserId: complaint.lastTransitionByUserId ?? undefined,
      lastTransitionAt: complaint.lastTransitionAt?.toISOString(),
      lastTransitionReason: complaint.lastTransitionReason ?? undefined,
    };
  }

  private toHistoryRecord(
    item: ComplaintHistoryEntity,
  ): ComplaintHistoryRecord {
    return {
      id: item.id,
      complaintId: item.complaintId,
      action: item.action as 'ASSIGNED' | 'TRANSITIONED',
      fromStatus: item.fromStatus as ComplaintStatusValue | null,
      toStatus: item.toStatus as ComplaintStatusValue,
      actorUserId: item.actorUserId,
      reason: item.reason ?? undefined,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
