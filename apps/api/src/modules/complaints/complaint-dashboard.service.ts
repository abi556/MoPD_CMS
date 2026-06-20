import { Injectable } from '@nestjs/common';
import { ComplaintStatus } from '@prisma/client';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplaintAccessService } from './complaint-access.service';

export interface TopCategoryRow {
  categoryId: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  count: number;
}

export interface QueueActivityRow {
  id: string;
  complaintId: string;
  referenceNo: string;
  subject: string;
  action: 'ASSIGNED' | 'TRANSITIONED';
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
}

@Injectable()
export class ComplaintDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly complaintAccessService: ComplaintAccessService,
  ) {}

  async getTopCategories(
    user: JwtUser,
    days = 30,
    limit = 5,
  ): Promise<{ categories: TopCategoryRow[]; days: number }> {
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const scopeFilter = this.complaintAccessService.buildListScopeFilter(user);
    const grouped = await this.prisma.complaint.groupBy({
      by: ['categoryId'],
      where: {
        ...scopeFilter,
        submittedAt: { gte: from },
        categoryId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: limit,
    });

    const categoryIds = grouped
      .map((row) => row.categoryId)
      .filter((id): id is string => id !== null);

    if (categoryIds.length === 0) {
      return { categories: [], days };
    }

    const categories = await this.prisma.complaintCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, code: true, nameEn: true, nameAm: true },
    });
    const categoryById = new Map(categories.map((row) => [row.id, row]));

    const result: TopCategoryRow[] = [];
    for (const row of grouped) {
      if (!row.categoryId) {
        continue;
      }
      const category = categoryById.get(row.categoryId);
      if (!category) {
        continue;
      }
      result.push({
        categoryId: category.id,
        code: category.code,
        nameEn: category.nameEn,
        nameAm: category.nameAm,
        count: row._count._all,
      });
    }

    return { categories: result, days };
  }

  async getRecentQueueActivity(
    user: JwtUser,
    limit = 10,
  ): Promise<{ events: QueueActivityRow[] }> {
    const scopeFilter = this.complaintAccessService.buildListScopeFilter(user);
    const rows = await this.prisma.complaintHistory.findMany({
      where: {
        complaint: scopeFilter,
        OR: [
          { action: 'ASSIGNED' },
          {
            action: 'TRANSITIONED',
            toStatus: ComplaintStatus.TRIAGE,
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        fromStatus: true,
        toStatus: true,
        createdAt: true,
        complaint: {
          select: {
            id: true,
            referenceNo: true,
            subject: true,
          },
        },
      },
    });

    return {
      events: rows.map((row) => ({
        id: row.id,
        complaintId: row.complaint.id,
        referenceNo: row.complaint.referenceNo,
        subject: row.complaint.subject,
        action: row.action as 'ASSIGNED' | 'TRANSITIONED',
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
