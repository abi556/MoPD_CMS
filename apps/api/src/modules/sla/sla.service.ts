import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ComplaintStatus,
  Priority,
  SlaStatus,
  UserNotificationSeverity,
  UserNotificationType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplaintAccessService } from '../complaints/complaint-access.service';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { PrismaService } from '../../prisma/prisma.service';
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import {
  INBOX_LINK,
  INBOX_MESSAGE_KEY,
} from '../notifications/in-app-notification.paths';
import { CreateSlaConfigDto } from './dto/create-sla-config.dto';
import { UpdateSlaConfigDto } from './dto/update-sla-config.dto';
import {
  SlaStatusResponseDto,
  SlaConfigResponseDto,
} from './dto/sla-status-response.dto';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly complaintAccessService: ComplaintAccessService,
    private readonly inAppNotifications: InAppNotificationService,
  ) {}

  // ---------------------------------------------------------------------------
  // Config management
  // ---------------------------------------------------------------------------

  async createSlaConfig(
    dto: CreateSlaConfigDto,
    correlationId?: string,
  ): Promise<SlaConfigResponseDto> {
    const config = await this.prisma.slaConfig.create({
      data: {
        name: dto.name,
        priority: dto.priority,
        categoryId: dto.categoryId ?? null,
        targetHours: dto.targetHours,
        warningThresholdPct: dto.warningThresholdPct ?? 80,
        escalationRoleId: dto.escalationRoleId ?? null,
        isActive: dto.isActive ?? true,
      },
    });
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.SLA_CONFIG_CREATED,
      entityType: 'sla_config',
      entityId: config.id,
      correlationId,
      metadata: {
        name: config.name,
        priority: config.priority,
        targetHours: config.targetHours,
      },
    });
    return this.toConfigDto(config);
  }

  async updateSlaConfig(
    id: string,
    dto: UpdateSlaConfigDto,
    correlationId?: string,
  ): Promise<SlaConfigResponseDto> {
    const existing = await this.prisma.slaConfig.findUniqueOrThrow({
      where: { id },
    });
    const updated = await this.prisma.slaConfig.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetHours !== undefined && { targetHours: dto.targetHours }),
        ...(dto.warningThresholdPct !== undefined && {
          warningThresholdPct: dto.warningThresholdPct,
        }),
        ...(dto.escalationRoleId !== undefined && {
          escalationRoleId: dto.escalationRoleId,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.SLA_CONFIG_UPDATED,
      entityType: 'sla_config',
      entityId: id,
      correlationId,
      metadata: {
        previous: { targetHours: existing.targetHours },
        next: { targetHours: updated.targetHours },
      },
    });
    return this.toConfigDto(updated);
  }

  async listSlaConfigs(): Promise<SlaConfigResponseDto[]> {
    const configs = await this.prisma.slaConfig.findMany({
      orderBy: [{ priority: 'asc' }, { categoryId: 'asc' }],
    });
    return configs.map((c) => this.toConfigDto(c));
  }

  // ---------------------------------------------------------------------------
  // Tracker lifecycle
  // ---------------------------------------------------------------------------

  async pickSlaConfig(
    priority: Priority,
    categoryId: string | null,
  ): Promise<{
    id: string;
    name: string;
    targetHours: number;
    warningThresholdPct: number;
  } | null> {
    // Prefer category-specific config if categoryId is provided
    if (categoryId) {
      const specific = await this.prisma.slaConfig.findFirst({
        where: { priority, categoryId, isActive: true },
      });
      if (specific) return specific;
    }
    // Fall back to generic (categoryId IS NULL)
    return this.prisma.slaConfig.findFirst({
      where: { priority, categoryId: null, isActive: true },
    });
  }

  async startTrackerForComplaint(
    complaintId: string,
    priority: Priority,
    categoryId: string | null,
    correlationId?: string,
  ): Promise<void> {
    const config = await this.pickSlaConfig(priority, categoryId);
    if (!config) {
      this.logger.warn(
        `No active SlaConfig found for priority=${priority} categoryId=${categoryId ?? 'null'} — skipping tracker for complaint ${complaintId}`,
      );
      return;
    }

    const startedAt = new Date();
    const targetAt = new Date(
      startedAt.getTime() + config.targetHours * 3_600_000,
    );
    const warningAt = new Date(
      startedAt.getTime() +
        config.targetHours * 3_600_000 * (config.warningThresholdPct / 100),
    );

    await this.prisma.complaintSla.create({
      data: {
        complaintId,
        slaConfigId: config.id,
        startedAt,
        targetAt,
        warningAt,
        status: SlaStatus.ACTIVE,
      },
    });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.SLA_TRACKER_STARTED,
      entityType: 'complaint',
      entityId: complaintId,
      correlationId,
      metadata: { slaConfigId: config.id, targetAt: targetAt.toISOString() },
    });
  }

  async completeTracker(
    complaintId: string,
    reason: string,
    correlationId?: string,
  ): Promise<void> {
    const tracker = await this.prisma.complaintSla.findUnique({
      where: { complaintId },
    });
    if (!tracker || tracker.status === SlaStatus.COMPLETED) return;

    await this.prisma.complaintSla.update({
      where: { complaintId },
      data: { status: SlaStatus.COMPLETED, completedAt: new Date() },
    });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.SLA_TRACKER_COMPLETED,
      entityType: 'complaint',
      entityId: complaintId,
      correlationId,
      metadata: { reason },
    });
  }

  async getStatusForComplaint(
    complaintId: string,
  ): Promise<SlaStatusResponseDto> {
    const tracker = await this.prisma.complaintSla.findUnique({
      where: { complaintId },
      include: { slaConfig: true },
    });
    if (!tracker) {
      throw new NotFoundException(
        `No SLA tracker found for complaint ${complaintId}`,
      );
    }

    const now = Date.now();
    const remainingMs = tracker.targetAt.getTime() - now;

    return {
      complaintId,
      slaConfigName: tracker.slaConfig.name,
      status: tracker.status,
      startedAt: tracker.startedAt.toISOString(),
      targetAt: tracker.targetAt.toISOString(),
      warningAt: tracker.warningAt.toISOString(),
      warnedAt: tracker.warnedAt?.toISOString() ?? null,
      breachedAt: tracker.breachedAt?.toISOString() ?? null,
      completedAt: tracker.completedAt?.toISOString() ?? null,
      remainingMs,
      isWarned: tracker.warnedAt !== null,
      isBreached: tracker.breachedAt !== null,
    };
  }

  // ---------------------------------------------------------------------------
  // Monitor (called by BullMQ worker)
  // ---------------------------------------------------------------------------

  async evaluateActive(): Promise<void> {
    const now = new Date();
    const activeTrackers = await this.prisma.complaintSla.findMany({
      where: { status: SlaStatus.ACTIVE },
      include: {
        slaConfig: true,
        complaint: { select: { id: true, referenceNo: true, assignedToUserId: true } },
      },
    });

    for (const tracker of activeTrackers) {
      // Issue warning (idempotent — only if not yet warned)
      if (tracker.warnedAt === null && now >= tracker.warningAt) {
        await this.prisma.complaintSla.updateMany({
          where: { id: tracker.id, warnedAt: null },
          data: { warnedAt: now },
        });
        await this.auditService.logEvent({
          eventType: AUDIT_EVENT.SLA_WARNING_EMITTED,
          entityType: 'complaint',
          entityId: tracker.complaintId,
          metadata: {
            slaConfigId: tracker.slaConfigId,
            targetAt: tracker.targetAt.toISOString(),
          },
        });
        const assigneeId = tracker.complaint.assignedToUserId;
        if (assigneeId) {
          await this.inAppNotifications.notify({
            userId: assigneeId,
            type: UserNotificationType.sla_warning,
            severity: UserNotificationSeverity.warning,
            messageKey: INBOX_MESSAGE_KEY.slaWarning,
            messageParams: {
              reference: tracker.complaint.referenceNo,
              thresholdPct: tracker.slaConfig.warningThresholdPct,
            },
            link: INBOX_LINK.complaint(tracker.complaintId),
            entityType: 'complaint',
            entityId: tracker.complaintId,
            dedupKey: `sla_warning:${tracker.id}`,
          });
        }
        this.logger.log(
          `SLA warning emitted for complaint ${tracker.complaintId}`,
        );
      }

      // Mark breached (idempotent — only if not yet breached)
      if (tracker.breachedAt === null && now >= tracker.targetAt) {
        await this.prisma.complaintSla.updateMany({
          where: { id: tracker.id, breachedAt: null },
          data: { status: SlaStatus.BREACHED, breachedAt: now },
        });
        await this.auditService.logEvent({
          eventType: AUDIT_EVENT.SLA_BREACHED,
          entityType: 'complaint',
          entityId: tracker.complaintId,
          metadata: {
            slaConfigId: tracker.slaConfigId,
            targetAt: tracker.targetAt.toISOString(),
          },
        });
        const breachRecipients = new Set<string>();
        if (tracker.complaint.assignedToUserId) {
          breachRecipients.add(tracker.complaint.assignedToUserId);
        }
        if (tracker.slaConfig.escalationRoleId) {
          const roleUsers = await this.prisma.userRole.findMany({
            where: { roleId: tracker.slaConfig.escalationRoleId },
            select: { userId: true },
          });
          for (const row of roleUsers) {
            breachRecipients.add(row.userId);
          }
        }
        await this.inAppNotifications.notifyMany(
          [...breachRecipients].map((userId) => ({
            userId,
            type: UserNotificationType.sla_breached,
            severity: UserNotificationSeverity.critical,
            messageKey: INBOX_MESSAGE_KEY.slaBreached,
            messageParams: { reference: tracker.complaint.referenceNo },
            link: INBOX_LINK.complaint(tracker.complaintId),
            entityType: 'complaint',
            entityId: tracker.complaintId,
            dedupKey: `sla_breached:${tracker.id}:${userId}`,
          })),
        );
        this.logger.warn(`SLA breached for complaint ${tracker.complaintId}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Dashboard metrics
  // ---------------------------------------------------------------------------

  async countAtRiskComplaints(user: JwtUser): Promise<number> {
    const now = new Date();
    const scopeFilter = this.complaintAccessService.buildListScopeFilter(user);
    const complaintWhere = {
      status: { not: ComplaintStatus.CLOSED },
      ...scopeFilter,
    };

    return this.prisma.complaintSla.count({
      where: {
        completedAt: null,
        complaint: complaintWhere,
        OR: [
          { status: SlaStatus.BREACHED },
          { breachedAt: { not: null } },
          { warnedAt: { not: null } },
          {
            status: SlaStatus.ACTIVE,
            breachedAt: null,
            warnedAt: null,
            warningAt: { lte: now },
          },
        ],
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Escalation
  // ---------------------------------------------------------------------------

  async escalateComplaint(
    complaintId: string,
    actorUserId: string,
    reason: string,
    correlationId?: string,
  ): Promise<void> {
    // Verify complaint exists via its SLA tracker (avoids importing ComplaintsService)
    const tracker = await this.prisma.complaintSla.findUnique({
      where: { complaintId },
    });
    if (!tracker) {
      // Allow escalation even without a tracker — complaint may have been created before SLA module
      this.logger.warn(
        `Escalating complaint ${complaintId} which has no SLA tracker`,
      );
    }

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.COMPLAINT_ESCALATED,
      actorUserId,
      entityType: 'complaint',
      entityId: complaintId,
      correlationId,
      metadata: { reason },
    });
  }

  // ---------------------------------------------------------------------------
  // Seed data
  // ---------------------------------------------------------------------------

  async ensureSeedSlaConfigs(): Promise<void> {
    const defaults: Array<{
      priority: Priority;
      targetHours: number;
      name: string;
    }> = [
      { priority: Priority.LOW, targetHours: 168, name: 'Low Priority (168h)' },
      {
        priority: Priority.NORMAL,
        targetHours: 72,
        name: 'Normal Priority (72h)',
      },
      { priority: Priority.HIGH, targetHours: 24, name: 'High Priority (24h)' },
      {
        priority: Priority.URGENT,
        targetHours: 8,
        name: 'Urgent Priority (8h)',
      },
    ];

    for (const config of defaults) {
      const existing = await this.prisma.slaConfig.findFirst({
        where: { priority: config.priority, categoryId: null, isActive: true },
      });
      if (!existing) {
        await this.prisma.slaConfig.create({
          data: {
            name: config.name,
            priority: config.priority,
            categoryId: null,
            targetHours: config.targetHours,
            warningThresholdPct: 80,
            isActive: true,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toConfigDto(config: {
    id: string;
    name: string;
    priority: Priority;
    categoryId: string | null;
    targetHours: number;
    warningThresholdPct: number;
    escalationRoleId: string | null;
    isActive: boolean;
    createdAt: Date;
  }): SlaConfigResponseDto {
    return {
      id: config.id,
      name: config.name,
      priority: config.priority,
      categoryId: config.categoryId,
      targetHours: config.targetHours,
      warningThresholdPct: config.warningThresholdPct,
      escalationRoleId: config.escalationRoleId,
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
    };
  }
}
