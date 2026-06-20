import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  CaseNote as CaseNoteEntity,
  CaseTask as CaseTaskEntity,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import {
  INBOX_LINK,
  INBOX_MESSAGE_KEY,
} from '../notifications/in-app-notification.paths';
import { UserNotificationSeverity, UserNotificationType } from '@prisma/client';
import { CaseNoteVisibilityValue } from './dto/case-note-visibility.enum';
import { CaseTaskStatusValue } from './dto/case-task-status.enum';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { CreateCaseTaskDto } from './dto/create-case-task.dto';
import { UpdateCaseTaskDto } from './dto/update-case-task.dto';

export interface CaseNoteRecord {
  id: string;
  complaintId: string;
  authorUserId: string;
  body: string;
  visibility: CaseNoteVisibilityValue;
  createdAt: string;
}

export interface CaseTaskRecord {
  id: string;
  complaintId: string;
  assigneeUserId: string;
  createdByUserId: string;
  title: string;
  status: CaseTaskStatusValue;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CaseCollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly inAppNotifications: InAppNotificationService,
  ) {}

  async listNotes(complaintId: string): Promise<CaseNoteRecord[]> {
    await this.assertComplaintExists(complaintId);
    const rows = await this.prisma.caseNote.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((row) => this.toCaseNoteRecord(row));
  }

  async createNote(
    complaintId: string,
    authorId: string,
    dto: CreateCaseNoteDto,
    correlationId?: string,
  ): Promise<CaseNoteRecord> {
    await this.assertComplaintExists(complaintId);
    const note = await this.prisma.caseNote.create({
      data: {
        complaintId,
        authorId,
        body: dto.body,
        visibility: dto.visibility ?? CaseNoteVisibilityValue.INTERNAL,
      },
    });
    const record = this.toCaseNoteRecord(note);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.CASE_NOTE_CREATED,
      actorUserId: authorId,
      entityType: 'complaint',
      entityId: complaintId,
      correlationId,
      metadata: {
        noteId: record.id,
        visibility: record.visibility,
      },
    });
    return record;
  }

  async listTasks(complaintId: string): Promise<CaseTaskRecord[]> {
    await this.assertComplaintExists(complaintId);
    const rows = await this.prisma.caseTask.findMany({
      where: { complaintId },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
      take: 200,
    });
    return rows.map((row) => this.toCaseTaskRecord(row));
  }

  async createTask(
    complaintId: string,
    createdById: string,
    dto: CreateCaseTaskDto,
    correlationId?: string,
  ): Promise<CaseTaskRecord> {
    await this.assertComplaintExists(complaintId);
    await this.assertActiveAssignee(dto.assigneeUserId);
    const task = await this.prisma.caseTask.create({
      data: {
        complaintId,
        assigneeId: dto.assigneeUserId,
        createdById,
        title: dto.title,
        dueAt: dto.dueAt ?? null,
      },
    });
    const record = this.toCaseTaskRecord(task);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.CASE_TASK_CREATED,
      actorUserId: createdById,
      entityType: 'complaint',
      entityId: complaintId,
      correlationId,
      metadata: {
        taskId: record.id,
        assigneeUserId: record.assigneeUserId,
        title: record.title,
      },
    });
    await this.inAppNotifications.notify({
      userId: record.assigneeUserId,
      type: UserNotificationType.case_task_assigned,
      severity: UserNotificationSeverity.info,
      messageKey: INBOX_MESSAGE_KEY.caseTaskAssigned,
      messageParams: { title: record.title, complaintId },
      link: INBOX_LINK.complaint(complaintId),
      entityType: 'case_task',
      entityId: record.id,
      dedupKey: `case_task_assigned:${record.id}`,
    });
    return record;
  }

  async updateTask(
    complaintId: string,
    taskId: string,
    actorId: string,
    dto: UpdateCaseTaskDto,
    correlationId?: string,
  ): Promise<CaseTaskRecord> {
    if (
      dto.status === undefined &&
      dto.title === undefined &&
      dto.assigneeUserId === undefined &&
      dto.dueAt === undefined
    ) {
      throw new UnprocessableEntityException(
        'At least one field must be provided for update',
      );
    }

    await this.assertComplaintExists(complaintId);

    const existing = await this.prisma.caseTask.findFirst({
      where: { id: taskId, complaintId },
    });
    if (!existing) {
      throw new NotFoundException('Case task not found');
    }

    if (dto.assigneeUserId !== undefined) {
      await this.assertActiveAssignee(dto.assigneeUserId);
    }

    const updated = await this.prisma.caseTask.update({
      where: { id: taskId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.assigneeUserId !== undefined
          ? { assigneeId: dto.assigneeUserId }
          : {}),
        ...(dto.dueAt !== undefined ? { dueAt: dto.dueAt } : {}),
      },
    });

    const record = this.toCaseTaskRecord(updated);
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.CASE_TASK_UPDATED,
      actorUserId: actorId,
      entityType: 'complaint',
      entityId: complaintId,
      correlationId,
      metadata: {
        taskId: record.id,
        status: record.status,
        assigneeUserId: record.assigneeUserId,
        title: record.title,
      },
    });
    if (
      dto.assigneeUserId !== undefined &&
      dto.assigneeUserId !== existing.assigneeId
    ) {
      await this.inAppNotifications.notify({
        userId: record.assigneeUserId,
        type: UserNotificationType.case_task_reassigned,
        severity: UserNotificationSeverity.info,
        messageKey: INBOX_MESSAGE_KEY.caseTaskReassigned,
        messageParams: { title: record.title, complaintId },
        link: INBOX_LINK.complaint(complaintId),
        entityType: 'case_task',
        entityId: record.id,
        dedupKey: `case_task_assigned:${record.id}:${record.assigneeUserId}`,
      });
    }
    return record;
  }

  private async assertComplaintExists(complaintId: string): Promise<void> {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
  }

  private async assertActiveAssignee(assigneeUserId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: assigneeUserId },
      select: { id: true, isActive: true },
    });
    if (!user?.isActive) {
      throw new UnprocessableEntityException(
        'Assignee user is invalid or inactive',
      );
    }
  }

  private toCaseNoteRecord(note: CaseNoteEntity): CaseNoteRecord {
    return {
      id: note.id,
      complaintId: note.complaintId,
      authorUserId: note.authorId,
      body: note.body,
      visibility: note.visibility as CaseNoteVisibilityValue,
      createdAt: note.createdAt.toISOString(),
    };
  }

  private toCaseTaskRecord(task: CaseTaskEntity): CaseTaskRecord {
    return {
      id: task.id,
      complaintId: task.complaintId,
      assigneeUserId: task.assigneeId,
      createdByUserId: task.createdById,
      title: task.title,
      status: task.status as CaseTaskStatusValue,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
