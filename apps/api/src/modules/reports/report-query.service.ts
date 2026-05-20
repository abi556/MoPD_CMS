import { Injectable } from '@nestjs/common';
import { ComplaintChannel, ComplaintStatus, SlaStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  bucketIndexForDate,
  generateBucketLabels,
} from './report-date-bucket.util';
import { ReportFilters, complaintWhereForFilters } from './report-filters';

export interface VolumeDashboardResult {
  buckets: string[];
  series: Array<{ status: ComplaintStatus; counts: number[] }>;
  meta: ReportFilters & { total: number };
}

export interface SlaDashboardResult {
  onTimePct: number;
  breachedPct: number;
  onTimeCount: number;
  breachedCount: number;
  activeCount: number;
  total: number;
  meta: ReportFilters;
}

export interface ResolutionDashboardResult {
  avgResolutionHours: number | null;
  resolutionRate: number;
  backlog: number;
  closedCount: number;
  createdCount: number;
  byBucket: Array<{ bucket: string; avgResolutionHours: number | null }>;
  meta: ReportFilters;
}

export interface ChannelsDashboardResult {
  channels: Array<{ channel: ComplaintChannel; count: number }>;
  meta: ReportFilters & { total: number };
}

@Injectable()
export class ReportQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getVolumeDashboard(
    filters: ReportFilters,
  ): Promise<VolumeDashboardResult> {
    const buckets = generateBucketLabels(
      filters.from,
      filters.to,
      filters.bucket,
    );
    const complaints = await this.prisma.complaint.findMany({
      where: complaintWhereForFilters(filters),
      select: { status: true, submittedAt: true },
    });

    const statusSet = new Set<ComplaintStatus>();
    for (const row of complaints) {
      statusSet.add(row.status);
    }
    const statuses = [...statusSet].sort();
    const seriesMap = new Map<ComplaintStatus, number[]>();
    for (const status of statuses) {
      seriesMap.set(
        status,
        buckets.map(() => 0),
      );
    }

    for (const row of complaints) {
      const idx = bucketIndexForDate(buckets, row.submittedAt, filters.bucket);
      if (idx < 0) {
        continue;
      }
      const counts = seriesMap.get(row.status);
      if (counts) {
        counts[idx] += 1;
      }
    }

    return {
      buckets,
      series: statuses.map((status) => ({
        status,
        counts: seriesMap.get(status) ?? buckets.map(() => 0),
      })),
      meta: { ...filters, total: complaints.length },
    };
  }

  async getSlaDashboard(filters: ReportFilters): Promise<SlaDashboardResult> {
    const complaintWhere = complaintWhereForFilters(filters);
    const trackers = await this.prisma.complaintSla.findMany({
      where: {
        startedAt: { gte: filters.from, lte: filters.to },
        complaint: complaintWhere,
      },
      select: {
        status: true,
        targetAt: true,
        breachedAt: true,
        completedAt: true,
      },
    });

    const now = new Date();
    let onTimeCount = 0;
    let breachedCount = 0;
    let activeCount = 0;

    for (const tracker of trackers) {
      const isBreached =
        tracker.breachedAt !== null || tracker.status === SlaStatus.BREACHED;
      if (isBreached) {
        breachedCount += 1;
        continue;
      }
      if (
        tracker.completedAt !== null &&
        tracker.completedAt.getTime() <= tracker.targetAt.getTime()
      ) {
        onTimeCount += 1;
        continue;
      }
      if (
        tracker.completedAt === null &&
        tracker.status === SlaStatus.ACTIVE &&
        now.getTime() <= tracker.targetAt.getTime()
      ) {
        onTimeCount += 1;
        activeCount += 1;
        continue;
      }
      if (tracker.completedAt === null && tracker.status === SlaStatus.ACTIVE) {
        activeCount += 1;
      }
    }

    const total = trackers.length;
    const onTimePct =
      total > 0 ? Math.round((onTimeCount / total) * 1000) / 10 : 0;
    const breachedPct =
      total > 0 ? Math.round((breachedCount / total) * 1000) / 10 : 0;

    return {
      onTimePct,
      breachedPct,
      onTimeCount,
      breachedCount,
      activeCount,
      total,
      meta: filters,
    };
  }

  async getResolutionDashboard(
    filters: ReportFilters,
  ): Promise<ResolutionDashboardResult> {
    const buckets = generateBucketLabels(
      filters.from,
      filters.to,
      filters.bucket,
    );
    const where = complaintWhereForFilters(filters);
    const complaints = await this.prisma.complaint.findMany({
      where,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
      },
    });

    const closedIds = complaints
      .filter((c) => c.status === ComplaintStatus.CLOSED)
      .map((c) => c.id);

    const closedHistory =
      closedIds.length > 0
        ? await this.prisma.complaintHistory.findMany({
            where: {
              complaintId: { in: closedIds },
              toStatus: ComplaintStatus.CLOSED,
            },
            select: { complaintId: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          })
        : [];

    const closedAtByComplaint = new Map<string, Date>();
    for (const h of closedHistory) {
      if (!closedAtByComplaint.has(h.complaintId)) {
        closedAtByComplaint.set(h.complaintId, h.createdAt);
      }
    }

    const resolutionHours: number[] = [];
    const bucketHours = buckets.map(() => [] as number[]);

    for (const complaint of complaints) {
      if (complaint.status !== ComplaintStatus.CLOSED) {
        continue;
      }
      const closedAt =
        closedAtByComplaint.get(complaint.id) ?? complaint.updatedAt;
      const hours =
        (closedAt.getTime() - complaint.submittedAt.getTime()) /
        (1000 * 60 * 60);
      resolutionHours.push(hours);
      const idx = bucketIndexForDate(
        buckets,
        complaint.submittedAt,
        filters.bucket,
      );
      if (idx >= 0) {
        bucketHours[idx].push(hours);
      }
    }

    const avgResolutionHours =
      resolutionHours.length > 0
        ? Math.round(
            (resolutionHours.reduce((a, b) => a + b, 0) /
              resolutionHours.length) *
              100,
          ) / 100
        : null;

    const createdCount = complaints.length;
    const closedCount = resolutionHours.length;
    const resolutionRate =
      createdCount > 0
        ? Math.round((closedCount / createdCount) * 1000) / 10
        : 0;

    const backlog = await this.prisma.complaint.count({
      where: {
        status: { not: ComplaintStatus.CLOSED },
        submittedAt: { lte: filters.to },
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.orgUnitId ? { orgUnitId: filters.orgUnitId } : {}),
      },
    });

    return {
      avgResolutionHours,
      resolutionRate,
      backlog,
      closedCount,
      createdCount,
      byBucket: buckets.map((bucket, i) => {
        const hours = bucketHours[i];
        return {
          bucket,
          avgResolutionHours:
            hours.length > 0
              ? Math.round(
                  (hours.reduce((a, b) => a + b, 0) / hours.length) * 100,
                ) / 100
              : null,
        };
      }),
      meta: filters,
    };
  }

  async getChannelsDashboard(
    filters: ReportFilters,
  ): Promise<ChannelsDashboardResult> {
    const rows = await this.prisma.complaint.groupBy({
      by: ['channel'],
      where: complaintWhereForFilters(filters),
      _count: { _all: true },
      orderBy: { channel: 'asc' },
    });

    const channels = rows.map((row) => ({
      channel: row.channel,
      count: row._count._all,
    }));
    const total = channels.reduce((sum, row) => sum + row.count, 0);

    return {
      channels,
      meta: { ...filters, total },
    };
  }

  async fetchComplaintExportRows(
    filters: ReportFilters,
    take: number,
  ): Promise<
    Array<{
      referenceNo: string;
      status: ComplaintStatus;
      channel: ComplaintChannel;
      priority: string;
      subject: string;
      submittedAt: Date;
      categoryId: string | null;
      orgUnitId: string | null;
    }>
  > {
    return this.prisma.complaint.findMany({
      where: complaintWhereForFilters(filters),
      orderBy: { submittedAt: 'desc' },
      take: take + 1,
      select: {
        referenceNo: true,
        status: true,
        channel: true,
        priority: true,
        subject: true,
        submittedAt: true,
        categoryId: true,
        orgUnitId: true,
      },
    });
  }
}
