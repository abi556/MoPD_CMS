import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseCollaborationService } from './case-collaboration.service';
import { CaseNoteVisibilityValue } from './dto/case-note-visibility.enum';
import { CaseTaskStatusValue } from './dto/case-task-status.enum';

describe('CaseCollaborationService', () => {
  let service: CaseCollaborationService;

  const complaintFindUnique = jest.fn();
  const caseNoteFindMany = jest.fn();
  const caseNoteCreate = jest.fn();
  const caseTaskFindMany = jest.fn();
  const caseTaskCreate = jest.fn();
  const caseTaskFindFirst = jest.fn();
  const caseTaskUpdate = jest.fn();
  const userFindUnique = jest.fn();
  const logEvent = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    complaintFindUnique.mockResolvedValue({ id: 'cmp_1' });
    userFindUnique.mockResolvedValue({
      id: 'user-officer-0001',
      isActive: true,
    });
    caseNoteFindMany.mockResolvedValue([]);
    caseNoteCreate.mockResolvedValue({
      id: 'note_1',
      complaintId: 'cmp_1',
      authorId: 'user_1',
      body: 'Test note',
      visibility: 'INTERNAL',
      createdAt: new Date('2026-05-16T10:00:00.000Z'),
    });
    caseTaskFindMany.mockResolvedValue([]);
    caseTaskCreate.mockResolvedValue({
      id: 'task_1',
      complaintId: 'cmp_1',
      assigneeId: 'user-officer-0001',
      createdById: 'user_1',
      title: 'Follow up',
      status: 'OPEN',
      dueAt: null,
      createdAt: new Date('2026-05-16T10:00:00.000Z'),
      updatedAt: new Date('2026-05-16T10:00:00.000Z'),
    });
    caseTaskFindFirst.mockResolvedValue({
      id: 'task_1',
      complaintId: 'cmp_1',
      assigneeId: 'user-officer-0001',
      createdById: 'user_1',
      title: 'Follow up',
      status: 'OPEN',
      dueAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    caseTaskUpdate.mockResolvedValue({
      id: 'task_1',
      complaintId: 'cmp_1',
      assigneeId: 'user-officer-0001',
      createdById: 'user_1',
      title: 'Follow up',
      status: 'DONE',
      dueAt: null,
      createdAt: new Date('2026-05-16T10:00:00.000Z'),
      updatedAt: new Date('2026-05-16T11:00:00.000Z'),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseCollaborationService,
        {
          provide: PrismaService,
          useValue: {
            complaint: { findUnique: complaintFindUnique },
            caseNote: { findMany: caseNoteFindMany, create: caseNoteCreate },
            caseTask: {
              findMany: caseTaskFindMany,
              create: caseTaskCreate,
              findFirst: caseTaskFindFirst,
              update: caseTaskUpdate,
            },
            user: { findUnique: userFindUnique },
          },
        },
        {
          provide: AuditService,
          useValue: { logEvent },
        },
      ],
    }).compile();

    service = module.get(CaseCollaborationService);
  });

  it('throws when complaint is missing', async () => {
    complaintFindUnique.mockResolvedValueOnce(null);
    await expect(service.listNotes('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates note and logs audit', async () => {
    const note = await service.createNote(
      'cmp_1',
      'user_1',
      { body: 'Test note' },
      'corr-1',
    );
    expect(note.body).toBe('Test note');
    expect(note.visibility).toBe(CaseNoteVisibilityValue.INTERNAL);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT.CASE_NOTE_CREATED,
        entityId: 'cmp_1',
      }),
    );
  });

  it('rejects inactive assignee on task create', async () => {
    userFindUnique.mockResolvedValueOnce({ id: 'bad', isActive: false });
    await expect(
      service.createTask('cmp_1', 'user_1', {
        title: 'Task',
        assigneeUserId: 'bad',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws when task not found for complaint', async () => {
    caseTaskFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.updateTask('cmp_1', 'task_missing', 'user_1', {
        status: CaseTaskStatusValue.DONE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects empty task update payload', async () => {
    await expect(
      service.updateTask('cmp_1', 'task_1', 'user_1', {}),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('lists notes for an existing complaint', async () => {
    caseNoteFindMany.mockResolvedValueOnce([
      {
        id: 'note_1',
        complaintId: 'cmp_1',
        authorId: 'user_1',
        body: 'Existing',
        visibility: 'INTERNAL',
        createdAt: new Date(),
      },
    ]);
    const notes = await service.listNotes('cmp_1');
    expect(notes).toHaveLength(1);
    expect(caseNoteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { complaintId: 'cmp_1' } }),
    );
  });

  it('updates task and logs audit', async () => {
    const task = await service.updateTask(
      'cmp_1',
      'task_1',
      'user_1',
      { status: CaseTaskStatusValue.DONE },
      'corr-2',
    );
    expect(task.status).toBe(CaseTaskStatusValue.DONE);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT.CASE_TASK_UPDATED,
      }),
    );
  });
});
