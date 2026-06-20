import type { Prisma, UserNotification } from '@prisma/client';
import {
  UserNotificationSeverity,
  UserNotificationType,
} from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotifyInput {
  userId: string;
  type: UserNotificationType;
  severity?: UserNotificationSeverity;
  messageKey: string;
  messageParams?: Prisma.InputJsonValue;
  link?: string;
  entityType?: string;
  entityId?: string;
  dedupKey?: string;
}

export interface ListUserNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export interface UserNotificationListResult {
  data: UserNotification[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class InAppNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(input: NotifyInput): Promise<UserNotification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, isActive: true },
    });
    if (!user?.isActive) {
      return null;
    }

    const data = {
      userId: input.userId,
      type: input.type,
      severity: input.severity ?? UserNotificationSeverity.info,
      messageKey: input.messageKey,
      messageParams: input.messageParams ?? undefined,
      link: input.link ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      dedupKey: input.dedupKey ?? null,
    };

    if (input.dedupKey) {
      return this.prisma.userNotification.upsert({
        where: {
          userId_dedupKey: {
            userId: input.userId,
            dedupKey: input.dedupKey,
          },
        },
        create: data,
        update: {
          severity: data.severity,
          messageKey: data.messageKey,
          messageParams: data.messageParams,
          link: data.link,
          entityType: data.entityType,
          entityId: data.entityId,
          readAt: null,
        },
      });
    }

    return this.prisma.userNotification.create({ data });
  }

  async notifyMany(inputs: NotifyInput[]): Promise<void> {
    for (const input of inputs) {
      await this.notify(input);
    }
  }

  async listForUser(
    userId: string,
    params: ListUserNotificationsParams = {},
  ): Promise<UserNotificationListResult> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;
    const where = {
      userId,
      ...(params.unreadOnly ? { readAt: null } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.userNotification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.userNotification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, notificationId: string): Promise<UserNotification> {
    const existing = await this.prisma.userNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    if (existing.readAt) {
      return existing;
    }
    return this.prisma.userNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
