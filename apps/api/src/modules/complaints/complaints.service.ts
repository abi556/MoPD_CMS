import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type {
  Complaint as ComplaintEntity,
  ComplaintHistory as ComplaintHistoryEntity,
  ComplaintLocale as PrismaComplaintLocale,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ComplaintChannel,
  ComplaintLocale,
  CreateComplaintDto,
} from './dto/create-complaint.dto';
import { ComplaintStatusValue } from './dto/complaint-status.enum';
import { ListComplaintsQueryDto } from './dto/list-complaints.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlaService } from '../sla/sla.service';
import { ComplaintAccessService } from './complaint-access.service';
import { WorkflowPolicyService } from './workflow-policy.service';
import { DocumentsService } from '../documents/documents.service';
import type { DocumentRecord } from '../documents/documents.service';
import type { UploadedMulterFile } from '../documents/types/uploaded-file';
import { getDocumentMaxBytes } from '../documents/document.config';

function getUploadTokenSecret(): string {
  if (process.env.COMPLAINT_UPLOAD_TOKEN_SECRET) {
    return process.env.COMPLAINT_UPLOAD_TOKEN_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'COMPLAINT_UPLOAD_TOKEN_SECRET must be configured in production',
    );
  }
  return 'dev-complaint-upload-token-secret-change-me';
}

function getUploadTokenTtlSec(): number {
  const raw = process.env.COMPLAINT_UPLOAD_TOKEN_TTL_SEC;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(parsed) || parsed < 60) {
    return 30 * 60;
  }
  return parsed;
}

function getUploadMaxFiles(): number {
  const raw = process.env.COMPLAINT_UPLOAD_MAX_FILES;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(parsed) || parsed < 1) {
    return 5;
  }
  return parsed;
}

function getPreferredPublicUploadOwnerId(): string {
  return (
    process.env.COMPLAINT_PUBLIC_UPLOAD_OWNER_ID ?? 'user-system-admin-0001'
  );
}

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
  categoryId?: string;
  orgUnitId?: string;
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
  priority?: string;
  responseDraft?: string | null;
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

export interface ComplaintUploadSession {
  token: string;
  expiresAt: string;
  complaintId: string;
  maxFiles: number;
  maxBytesPerFile: number;
}

export interface ComplaintCreateResult {
  complaint: ComplaintRecord;
  uploadSession?: ComplaintUploadSession;
  /** True when submit acknowledgment email was queued for complainantEmail. */
  ackEmailQueued: boolean;
}

interface UploadTokenPayload {
  complaintId: string;
  exp: number;
  purpose: 'evidence_upload';
  maxFiles: number;
  maxBytesPerFile: number;
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
    private readonly notificationsService: NotificationsService,
    private readonly complaintAccessService: ComplaintAccessService,
    private readonly workflowPolicyService: WorkflowPolicyService,
    private readonly documentsService: DocumentsService,
  ) {}

  async create(
    payload: CreateComplaintDto,
    correlationId?: string,
  ): Promise<ComplaintCreateResult> {
    if (payload.categoryId) {
      const cat = await this.prisma.complaintCategory.findUnique({
        where: { id: payload.categoryId },
      });
      if (!cat || !cat.isActive) {
        throw new BadRequestException(
          `Category "${payload.categoryId}" does not exist or is inactive`,
        );
      }
    }

    if (payload.orgUnitId) {
      const unit = await this.prisma.orgUnit.findUnique({
        where: { id: payload.orgUnitId },
      });
      if (!unit || !unit.isActive) {
        throw new BadRequestException(
          `Org unit "${payload.orgUnitId}" does not exist or is inactive`,
        );
      }
    }

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
          categoryId: payload.categoryId ?? null,
          orgUnitId: payload.orgUnitId ?? null,
        },
      });

      const referenceNo = this.buildReferenceNo(inserted.submittedAt);

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
        categoryId: record.categoryId,
        orgUnitId: record.orgUnitId,
      },
    });
    const ackEmailQueued = Boolean(payload.complainantEmail?.trim());
    if (ackEmailQueued) {
      void this.notificationsService
        .queueComplaintSubmittedAck(
          payload.complainantEmail!,
          record.referenceNo,
          payload.locale as PrismaComplaintLocale,
          correlationId,
        )
        .catch(() => undefined);
    }
    return {
      complaint: record,
      uploadSession: payload.requestUploadSession
        ? this.issueUploadSession(record.id)
        : undefined,
      ackEmailQueued,
    };
  }

  async uploadPublicEvidence(
    complaintId: string,
    token: string,
    file: UploadedMulterFile,
    correlationId?: string,
  ) {
    const claims = this.verifyUploadSession(token);
    if (claims.complaintId !== complaintId) {
      throw new ForbiddenException('Upload token does not match complaint id');
    }

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const documentStore = this.prisma.document as unknown as {
      count?: (args: { where: { complaintId: string } }) => Promise<number>;
    };
    if (documentStore.count) {
      const existingCount = await documentStore.count({
        where: { complaintId },
      });
      if (existingCount >= claims.maxFiles) {
        throw new ConflictException('Maximum number of evidence files reached');
      }
    }

    const ownerUserId = await this.resolvePublicUploadOwnerId();
    return this.documentsService.upload(
      complaintId,
      ownerUserId,
      file,
      correlationId,
    );
  }

  private issueUploadSession(complaintId: string): ComplaintUploadSession {
    const ttlSec = getUploadTokenTtlSec();
    const nowSec = Math.floor(Date.now() / 1000);
    const payload: UploadTokenPayload = {
      complaintId,
      exp: nowSec + ttlSec,
      purpose: 'evidence_upload',
      maxFiles: getUploadMaxFiles(),
      maxBytesPerFile: getDocumentMaxBytes(),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', getUploadTokenSecret())
      .update(encodedPayload)
      .digest('base64url');
    return {
      token: `${encodedPayload}.${signature}`,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      complaintId,
      maxFiles: payload.maxFiles,
      maxBytesPerFile: payload.maxBytesPerFile,
    };
  }

  private verifyUploadSession(token: string): UploadTokenPayload {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new ForbiddenException('Invalid upload token');
    }

    const expected = createHmac('sha256', getUploadTokenSecret())
      .update(encodedPayload)
      .digest('base64url');
    if (
      expected.length !== signature.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      throw new ForbiddenException('Invalid upload token signature');
    }

    let payload: UploadTokenPayload;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as UploadTokenPayload;
    } catch {
      throw new ForbiddenException('Invalid upload token payload');
    }

    if (payload.purpose !== 'evidence_upload') {
      throw new ForbiddenException('Invalid upload token purpose');
    }
    if (
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new ForbiddenException('Upload token expired');
    }
    return payload;
  }

  private async resolvePublicUploadOwnerId(): Promise<string> {
    const preferred = getPreferredPublicUploadOwnerId();
    const preferredUser = await this.prisma.user.findUnique({
      where: { id: preferred },
      select: { id: true },
    });
    if (preferredUser) {
      return preferredUser.id;
    }
    const fallback = await this.prisma.user.findMany({
      take: 1,
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!fallback.length) {
      throw new NotFoundException('No uploader account available for evidence');
    }
    return fallback[0].id;
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

  async getByIdForStaff(id: string, user: JwtUser): Promise<ComplaintRecord> {
    const found = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!found) {
      throw new NotFoundException('Complaint not found');
    }

    this.complaintAccessService.assertCanAccessComplaint(user, found);
    return this.toComplaintRecord(found);
  }

  async updateComplaintMetadata(
    id: string,
    user: JwtUser,
    payload: UpdateComplaintDto,
    correlationId?: string,
  ): Promise<ComplaintRecord> {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Complaint not found');
    }
    this.complaintAccessService.assertCanAccessComplaint(user, existing);

    if (payload.categoryId) {
      const cat = await this.prisma.complaintCategory.findUnique({
        where: { id: payload.categoryId },
      });
      if (!cat || !cat.isActive) {
        throw new BadRequestException('Invalid or inactive complaint category');
      }
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        ...(payload.categoryId !== undefined
          ? { categoryId: payload.categoryId }
          : {}),
        ...(payload.orgUnitId !== undefined
          ? { orgUnitId: payload.orgUnitId }
          : {}),
        ...(payload.priority !== undefined
          ? { priority: payload.priority }
          : {}),
        ...(payload.responseDraft !== undefined
          ? {
              responseDraft:
                payload.responseDraft === null
                  ? null
                  : payload.responseDraft.trim() || null,
            }
          : {}),
      },
    });

    const record = this.toComplaintRecord(updated);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_UPDATED,
      actorUserId: user.id,
      actorRoles: user.roles,
      entityType: 'complaint',
      entityId: id,
      correlationId,
      metadata: { fields: Object.keys(payload) },
    });
    return record;
  }

  async appealComplaint(
    id: string,
    user: JwtUser,
    reason: string,
    correlationId?: string,
  ): Promise<ComplaintRecord> {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Complaint not found');
    }
    this.complaintAccessService.assertCanAccessComplaint(user, existing);
    this.workflowPolicyService.assertCanTransition(
      user,
      existing.status as ComplaintStatusValue,
      ComplaintStatusValue.APPEAL,
    );
    return this.transitionComplaint(
      id,
      ComplaintStatusValue.APPEAL,
      user.id,
      reason,
      correlationId,
      user,
    );
  }

  async assignComplaint(
    id: string,
    assigneeUserId: string,
    assignedByUserId: string,
    reason?: string,
    correlationId?: string,
    actor?: JwtUser,
  ): Promise<ComplaintRecord> {
    if (actor) {
      this.workflowPolicyService.assertCanAssign(actor);
      const existing = await this.prisma.complaint.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException('Complaint not found');
      }
      this.complaintAccessService.assertCanAccessComplaint(actor, existing);
    }
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
      actorRoles: actor?.roles,
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
    actor?: JwtUser,
  ): Promise<ComplaintRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.complaint.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Complaint not found');
      }

      if (actor) {
        this.complaintAccessService.assertCanAccessComplaint(actor, existing);
      }

      const fromStatus = existing.status as ComplaintStatusValue;
      if (actor) {
        this.workflowPolicyService.assertCanTransition(
          actor,
          fromStatus,
          toStatus,
        );
      }

      const allowedNext = this.allowedTransitions[fromStatus] ?? [];

      if (!allowedNext.includes(toStatus)) {
        throw new UnprocessableEntityException(
          `Invalid transition from ${fromStatus} to ${toStatus}`,
        );
      }

      if (
        fromStatus === ComplaintStatusValue.DRAFT_RESPONSE &&
        toStatus === ComplaintStatusValue.QA_LEGAL_REVIEW
      ) {
        const draft = existing.responseDraft?.trim() ?? '';
        if (draft.length < 20) {
          throw new UnprocessableEntityException(
            'A response draft of at least 20 characters is required before QA review.',
          );
        }
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
      actorRoles: actor?.roles,
      entityType: 'complaint',
      entityId: id,
      correlationId,
      metadata: {
        toStatus,
        reason,
      },
    });
    if (record.complainantEmail) {
      void this.notificationsService
        .queueComplaintTransitionIfApplicable(
          record.complainantEmail,
          record.referenceNo,
          toStatus,
          record.locale as PrismaComplaintLocale,
          correlationId,
        )
        .catch(() => undefined);
    }
    return record;
  }

  async getHistoryForStaff(
    id: string,
    user: JwtUser,
  ): Promise<ComplaintHistoryRecord[]> {
    const exists = await this.prisma.complaint.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Complaint not found');
    }
    this.complaintAccessService.assertCanAccessComplaint(user, exists);

    const rows = await this.prisma.complaintHistory.findMany({
      where: { complaintId: id },
      orderBy: [{ createdAt: 'asc' }],
    });

    return rows.map((row) => this.toHistoryRecord(row));
  }

  async getDocumentsForStaff(
    id: string,
    user: JwtUser,
  ): Promise<DocumentRecord[]> {
    const exists = await this.prisma.complaint.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Complaint not found');
    }
    this.complaintAccessService.assertCanAccessComplaint(user, exists);
    return this.documentsService.listByComplaint(id);
  }

  async listForStaff(
    query: ListComplaintsQueryDto,
    user: JwtUser,
  ): Promise<ComplaintListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const scopeFilter = this.complaintAccessService.buildListScopeFilter(user);
    const where = {
      ...scopeFilter,
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

  private buildReferenceNo(submittedAt: Date): string {
    const year = submittedAt.getUTCFullYear();
    const token = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    return `CMS-${year}-${token}`;
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
      categoryId: complaint.categoryId ?? undefined,
      orgUnitId: complaint.orgUnitId ?? undefined,
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
      priority: complaint.priority ?? undefined,
      responseDraft: complaint.responseDraft ?? null,
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
