import {
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
    [ComplaintStatusValue.SUBMITTED]: [ComplaintStatusValue.ASSIGNED],
    [ComplaintStatusValue.ASSIGNED]: [ComplaintStatusValue.IN_INVESTIGATION],
    [ComplaintStatusValue.IN_INVESTIGATION]: [ComplaintStatusValue.CLOSED],
    [ComplaintStatusValue.CLOSED]: [],
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateComplaintDto): Promise<ComplaintRecord> {
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

    return this.toComplaintRecord(created);
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
  ): Promise<ComplaintRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.complaint.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Complaint not found');
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
          fromStatus: existing.status,
          toStatus: ComplaintStatusValue.ASSIGNED,
          actorUserId: assignedByUserId,
          reason: reason ?? null,
        },
      });

      return updatedComplaint;
    });

    return this.toComplaintRecord(updated);
  }

  async transitionComplaint(
    id: string,
    toStatus: ComplaintStatusValue,
    transitionedByUserId: string,
    reason: string,
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

    return this.toComplaintRecord(updated);
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
