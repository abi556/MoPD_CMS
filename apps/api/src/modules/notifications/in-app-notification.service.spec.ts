import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserNotificationSeverity, UserNotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InAppNotificationService } from './in-app-notification.service';

describe('InAppNotificationService', () => {
  let service: InAppNotificationService;

  const userFindUnique = jest.fn();
  const userNotificationCreate = jest.fn();
  const userNotificationUpsert = jest.fn();
  const userNotificationFindMany = jest.fn();
  const userNotificationCount = jest.fn();
  const userNotificationFindFirst = jest.fn();
  const userNotificationUpdate = jest.fn();
  const userNotificationUpdateMany = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    userFindUnique.mockResolvedValue({ id: 'user-1', isActive: true });
    userNotificationCreate.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'notif-1',
        ...data,
        readAt: null,
        createdAt: new Date(),
      }),
    );
    userNotificationUpsert.mockImplementation(({ create }) =>
      Promise.resolve({
        id: 'notif-1',
        ...create,
        readAt: null,
        createdAt: new Date(),
      }),
    );
    userNotificationFindMany.mockResolvedValue([]);
    userNotificationCount.mockResolvedValue(0);
    userNotificationFindFirst.mockResolvedValue(null);
    userNotificationUpdate.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, readAt: data.readAt }),
    );
    userNotificationUpdateMany.mockResolvedValue({ count: 2 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InAppNotificationService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: userFindUnique },
            userNotification: {
              create: userNotificationCreate,
              upsert: userNotificationUpsert,
              findMany: userNotificationFindMany,
              count: userNotificationCount,
              findFirst: userNotificationFindFirst,
              update: userNotificationUpdate,
              updateMany: userNotificationUpdateMany,
            },
          },
        },
      ],
    }).compile();

    service = module.get(InAppNotificationService);
  });

  describe('notify', () => {
    it('creates notification for active user', async () => {
      const result = await service.notify({
        userId: 'user-1',
        type: UserNotificationType.complaint_assigned,
        messageKey: 'inbox.types.complaintAssigned',
        messageParams: { reference: 'CMP-001' },
        link: '/dashboard/complaints/c1',
        entityType: 'complaint',
        entityId: 'c1',
      });

      expect(userNotificationCreate).toHaveBeenCalled();
      expect(result?.id).toBe('notif-1');
    });

    it('skips inactive users', async () => {
      userFindUnique.mockResolvedValue({ id: 'user-1', isActive: false });
      const result = await service.notify({
        userId: 'user-1',
        type: UserNotificationType.complaint_assigned,
        messageKey: 'inbox.types.complaintAssigned',
      });
      expect(result).toBeNull();
      expect(userNotificationCreate).not.toHaveBeenCalled();
    });

    it('upserts when dedupKey is provided', async () => {
      await service.notify({
        userId: 'user-1',
        type: UserNotificationType.sla_warning,
        severity: UserNotificationSeverity.warning,
        messageKey: 'inbox.types.slaWarning',
        dedupKey: 'sla_warning:sla-1',
      });
      expect(userNotificationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_dedupKey: {
              userId: 'user-1',
              dedupKey: 'sla_warning:sla-1',
            },
          },
        }),
      );
    });
  });

  describe('listForUser', () => {
    it('returns paginated notifications', async () => {
      userNotificationFindMany.mockResolvedValue([{ id: 'n1' }]);
      userNotificationCount.mockResolvedValue(1);

      const result = await service.listForUser('user-1', {
        page: 1,
        pageSize: 20,
        unreadOnly: true,
      });

      expect(userNotificationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', readAt: null },
        }),
      );
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('countUnread', () => {
    it('counts unread notifications', async () => {
      userNotificationCount.mockResolvedValue(3);
      await expect(service.countUnread('user-1')).resolves.toBe(3);
    });
  });

  describe('markRead', () => {
    it('throws when notification not owned', async () => {
      userNotificationFindFirst.mockResolvedValue(null);
      await expect(service.markRead('user-1', 'n1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns existing when already read', async () => {
      const read = { id: 'n1', readAt: new Date() };
      userNotificationFindFirst.mockResolvedValue(read);
      await expect(service.markRead('user-1', 'n1')).resolves.toBe(read);
      expect(userNotificationUpdate).not.toHaveBeenCalled();
    });

    it('marks unread notification as read', async () => {
      userNotificationFindFirst.mockResolvedValue({ id: 'n1', readAt: null });
      await service.markRead('user-1', 'n1');
      expect(userNotificationUpdate).toHaveBeenCalled();
    });
  });

  describe('markAllRead', () => {
    it('updates all unread for user', async () => {
      const result = await service.markAllRead('user-1');
      expect(result.updated).toBe(2);
      expect(userNotificationUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });
});
