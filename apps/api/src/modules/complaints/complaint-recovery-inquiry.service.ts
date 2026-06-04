import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplaintLocale,
  ReferenceRecoveryInquiryStatus,
} from '@prisma/client';
import { normalizeComplainantEmail } from '../../common/utils/contact-normalization';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import {
  buildPublicComplaintNewUrl,
  buildPublicTrackUrl,
  NotificationsService,
} from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRecoveryInquiryDto } from './dto/recovery-inquiry.dto';
import type { ResolveRecoveryInquiryDto } from './dto/recovery-inquiry.dto';
import type { ListRecoveryInquiriesQueryDto } from './dto/recovery-inquiry.dto';

const INQUIRY_CREATED_MESSAGE =
  'Your request was received. We will email you at the address you provided when staff have an outcome. This may take several business days.';

const INQUIRY_EMAIL_WINDOW_MS = 86_400_000;
const INQUIRY_EMAIL_MAX_PER_WINDOW = 5;

@Injectable()
export class ComplaintRecoveryInquiryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createInquiry(
    body: CreateRecoveryInquiryDto,
    correlationId?: string,
  ): Promise<{ inquiryId: string; message: string }> {
    let submittedDateGregorian: Date | null = null;
    if (body.submittedDateGregorian) {
      const parsed = new Date(body.submittedDateGregorian);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid submittedDateGregorian');
      }
      submittedDateGregorian = parsed;
    }

    const contactEmail = normalizeComplainantEmail(body.contactEmail);

    await this.assertContactEmailRateLimit(contactEmail);

    const inquiry = await this.prisma.referenceRecoveryInquiry.create({
      data: {
        locale: body.locale,
        subjectFragment: body.subjectFragment.trim(),
        submittedDateGregorian,
        submittedDateEthiopian: body.submittedDateEthiopian?.trim() || null,
        categoryId: body.categoryId ?? null,
        orgUnitId: body.orgUnitId ?? null,
        contactEmail,
        additionalNotes: body.additionalNotes?.trim() || null,
      },
    });

    void this.notificationsService
      .queueEmail('complaint_recovery_inquiry_received', contactEmail, {
        locale: body.locale,
        correlationId,
        variables: {},
      })
      .catch(() => undefined);

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_RECOVERY_INQUIRY_CREATED,
      entityType: 'reference_recovery_inquiry',
      entityId: inquiry.id,
      correlationId,
    });

    return { inquiryId: inquiry.id, message: INQUIRY_CREATED_MESSAGE };
  }

  async listInquiries(query: ListRecoveryInquiriesQueryDto) {
    const rows = await this.prisma.referenceRecoveryInquiry.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toItem(row));
  }

  async resolveInquiry(
    id: string,
    body: ResolveRecoveryInquiryDto,
    actorUserId: string,
    correlationId?: string,
  ) {
    const existing = await this.prisma.referenceRecoveryInquiry.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Recovery inquiry not found');
    }

    if (
      body.status === ReferenceRecoveryInquiryStatus.RESOLVED &&
      !body.resolvedReferenceNo?.trim()
    ) {
      throw new BadRequestException(
        'resolvedReferenceNo is required when status is RESOLVED',
      );
    }

    const updated = await this.prisma.referenceRecoveryInquiry.update({
      where: { id },
      data: {
        status: body.status,
        matchedComplaintId: body.matchedComplaintId ?? null,
        resolvedReferenceNo: body.resolvedReferenceNo?.trim() ?? null,
        assignedToUserId: actorUserId,
      },
    });

    if (
      body.status === ReferenceRecoveryInquiryStatus.RESOLVED &&
      body.resolvedReferenceNo &&
      body.matchedComplaintId
    ) {
      await this.prisma.caseNote.create({
        data: {
          complaintId: body.matchedComplaintId,
          authorId: actorUserId,
          body: `Reference recovery inquiry ${id} resolved. Reference shared: ${body.resolvedReferenceNo.trim()}.`,
          visibility: 'INTERNAL',
        },
      });
    }

    this.notifyInquiryOutcome(existing, body, correlationId);

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_RECOVERY_INQUIRY_RESOLVED,
      actorUserId,
      entityType: 'reference_recovery_inquiry',
      entityId: id,
      correlationId,
      metadata: {
        status: body.status,
        resolvedReferenceNo: body.resolvedReferenceNo ?? null,
      },
    });

    return this.toItem(updated);
  }

  private async assertContactEmailRateLimit(
    contactEmail: string,
  ): Promise<void> {
    const since = new Date(Date.now() - INQUIRY_EMAIL_WINDOW_MS);
    const recentCount = await this.prisma.referenceRecoveryInquiry.count({
      where: {
        contactEmail,
        createdAt: { gte: since },
      },
    });
    if (recentCount >= INQUIRY_EMAIL_MAX_PER_WINDOW) {
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message:
            'Too many recovery requests for this email address today. Please try again tomorrow or contact MoPD through official channels.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private notifyInquiryOutcome(
    inquiry: {
      contactEmail: string;
      locale: ComplaintLocale;
    },
    body: ResolveRecoveryInquiryDto,
    correlationId?: string,
  ): void {
    const email = inquiry.contactEmail;
    const locale = inquiry.locale;

    if (
      body.status === ReferenceRecoveryInquiryStatus.RESOLVED &&
      body.resolvedReferenceNo?.trim()
    ) {
      const trackUrl = buildPublicTrackUrl(body.resolvedReferenceNo.trim());
      void this.notificationsService
        .queueEmail('complaint_recovery_resolved', email, {
          locale,
          correlationId,
          variables: {
            referenceNo: body.resolvedReferenceNo.trim(),
            trackUrl,
          },
        })
        .catch(() => undefined);
      return;
    }

    if (body.status === ReferenceRecoveryInquiryStatus.REJECTED) {
      const newComplaintUrl = buildPublicComplaintNewUrl(locale);
      void this.notificationsService
        .queueEmail('complaint_recovery_inquiry_rejected', email, {
          locale,
          correlationId,
          variables: { newComplaintUrl },
        })
        .catch(() => undefined);
    }
  }

  async searchComplaintCandidates(inquiryId: string) {
    const inquiry = await this.prisma.referenceRecoveryInquiry.findUnique({
      where: { id: inquiryId },
    });
    if (!inquiry) {
      throw new NotFoundException('Recovery inquiry not found');
    }

    const dateFrom = inquiry.submittedDateGregorian
      ? new Date(inquiry.submittedDateGregorian.getTime() - 3 * 86400000)
      : undefined;
    const dateTo = inquiry.submittedDateGregorian
      ? new Date(inquiry.submittedDateGregorian.getTime() + 3 * 86400000)
      : undefined;

    return this.prisma.complaint.findMany({
      where: {
        ...(inquiry.categoryId ? { categoryId: inquiry.categoryId } : {}),
        ...(inquiry.orgUnitId ? { orgUnitId: inquiry.orgUnitId } : {}),
        ...(dateFrom && dateTo
          ? { submittedAt: { gte: dateFrom, lte: dateTo } }
          : {}),
        subject: {
          contains: inquiry.subjectFragment,
          mode: 'insensitive',
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        referenceNo: true,
        subject: true,
        submittedAt: true,
        status: true,
        complainantEmail: true,
      },
    });
  }

  private toItem(row: {
    id: string;
    status: ReferenceRecoveryInquiryStatus;
    locale: ComplaintLocale;
    subjectFragment: string;
    submittedDateGregorian: Date | null;
    submittedDateEthiopian: string | null;
    categoryId: string | null;
    orgUnitId: string | null;
    contactEmail: string;
    additionalNotes: string | null;
    matchedComplaintId: string | null;
    resolvedReferenceNo: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      status: row.status,
      locale: row.locale,
      subjectFragment: row.subjectFragment,
      submittedDateGregorian: row.submittedDateGregorian?.toISOString() ?? null,
      submittedDateEthiopian: row.submittedDateEthiopian,
      categoryId: row.categoryId,
      orgUnitId: row.orgUnitId,
      contactEmail: row.contactEmail,
      additionalNotes: row.additionalNotes,
      matchedComplaintId: row.matchedComplaintId,
      resolvedReferenceNo: row.resolvedReferenceNo,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
