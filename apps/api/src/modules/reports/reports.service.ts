import { InjectQueue } from '@nestjs/bullmq';
import {
  GoneException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ReportExportFormat,
  ReportExportStatus,
  type ReportExport,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { QUEUE_REPORT_EXPORT } from '../../queue/queue.constants';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import {
  getExportsBucket,
  getPresignTtlSec,
  getReportExportMaxRows,
  getReportExportTtlSec,
} from '../documents/document.config';
import { DocumentStorageFactory } from '../documents/storage/document-storage.factory';
import { PrismaService } from '../../prisma/prisma.service';
import { complaintsToCsv } from './report-export-csv.util';
import { complaintsToXlsxBuffer } from './report-export-xlsx.util';
import { complaintsToPdfBuffer } from './report-export-pdf.util';
import { ReportQueryService } from './report-query.service';
import { ReportFilters, normalizeReportFilters } from './report-filters';

export interface CreateExportInput {
  format: 'csv' | 'xlsx' | 'pdf';
  reportType: 'complaints';
  from: string;
  to: string;
  bucket?: 'day' | 'week' | 'month';
  categoryId?: string;
  orgUnitId?: string;
}

function filtersToMeta(filters: ReportFilters): Record<string, unknown> {
  return {
    from: filters.from.toISOString(),
    to: filters.to.toISOString(),
    bucket: filters.bucket,
    categoryId: filters.categoryId ?? null,
    orgUnitId: filters.orgUnitId ?? null,
  };
}

function metaToResponse(meta: ReportFilters): {
  from: string;
  to: string;
  bucket: string;
  categoryId?: string;
  orgUnitId?: string;
} {
  return {
    from: meta.from.toISOString(),
    to: meta.to.toISOString(),
    bucket: meta.bucket,
    ...(meta.categoryId ? { categoryId: meta.categoryId } : {}),
    ...(meta.orgUnitId ? { orgUnitId: meta.orgUnitId } : {}),
  };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportQuery: ReportQueryService,
    private readonly audit: AuditService,
    private readonly storageFactory: DocumentStorageFactory,
    @InjectQueue(QUEUE_REPORT_EXPORT)
    private readonly reportExportQueue: Queue,
  ) {}

  async getVolume(filters: ReportFilters) {
    const result = await this.reportQuery.getVolumeDashboard(filters);
    return {
      buckets: result.buckets,
      series: result.series,
      events: result.events,
      meta: { ...metaToResponse(result.meta), total: result.meta.total },
    };
  }

  async getSla(filters: ReportFilters) {
    const result = await this.reportQuery.getSlaDashboard(filters);
    return {
      onTimePct: result.onTimePct,
      breachedPct: result.breachedPct,
      onTimeCount: result.onTimeCount,
      breachedCount: result.breachedCount,
      activeCount: result.activeCount,
      total: result.total,
      meta: metaToResponse(result.meta),
    };
  }

  async getResolution(filters: ReportFilters) {
    const result = await this.reportQuery.getResolutionDashboard(filters);
    return {
      avgResolutionHours: result.avgResolutionHours,
      resolutionRate: result.resolutionRate,
      backlog: result.backlog,
      closedCount: result.closedCount,
      createdCount: result.createdCount,
      byBucket: result.byBucket,
      meta: metaToResponse(result.meta),
    };
  }

  async getChannels(filters: ReportFilters) {
    const result = await this.reportQuery.getChannelsDashboard(filters);
    return {
      channels: result.channels,
      meta: { ...metaToResponse(result.meta), total: result.meta.total },
    };
  }

  async createExport(
    input: CreateExportInput,
    requestedById: string,
    correlationId?: string,
  ): Promise<ReportExport> {
    const filters = normalizeReportFilters(input);
    const expiresAt = new Date(Date.now() + getReportExportTtlSec() * 1000);

    const record = await this.prisma.reportExport.create({
      data: {
        requestedById,
        format:
          input.format === 'xlsx'
            ? ReportExportFormat.xlsx
            : input.format === 'pdf'
              ? ReportExportFormat.pdf
              : ReportExportFormat.csv,
        status: ReportExportStatus.PENDING,
        filters: {
          reportType: input.reportType,
          ...filtersToMeta(filters),
        },
        expiresAt,
      },
    });

    await this.audit.logEvent({
      eventType: AUDIT_EVENT.REPORT_EXPORT_REQUESTED,
      actorUserId: requestedById,
      entityType: 'report_export',
      entityId: record.id,
      correlationId,
      metadata: {
        format: input.format,
        reportType: input.reportType,
        ...filtersToMeta(filters),
      },
    });

    const runInline =
      process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

    if (runInline) {
      await this.processExport(record.id, correlationId);
      const updated = await this.prisma.reportExport.findUnique({
        where: { id: record.id },
      });
      return updated ?? record;
    }

    await this.reportExportQueue.add(
      'generate',
      { exportId: record.id, correlationId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );

    return record;
  }

  async processExport(exportId: string, correlationId?: string): Promise<void> {
    const record = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });
    if (!record) {
      return;
    }

    await this.prisma.reportExport.update({
      where: { id: exportId },
      data: { status: ReportExportStatus.PROCESSING },
    });

    try {
      const filtersJson = record.filters as Record<string, unknown>;
      const filters = normalizeReportFilters({
        from: String(filtersJson.from),
        to: String(filtersJson.to),
        bucket: filtersJson.bucket as 'day' | 'week' | 'month' | undefined,
        categoryId: filtersJson.categoryId as string | undefined,
        orgUnitId: filtersJson.orgUnitId as string | undefined,
      });

      const maxRows = getReportExportMaxRows();
      const rows = await this.reportQuery.fetchComplaintExportRows(
        filters,
        maxRows,
      );

      if (rows.length > maxRows) {
        throw new UnprocessableEntityException({
          error: {
            code: 'export_limit_exceeded',
            message: `Export exceeds maximum of ${maxRows} rows. Narrow your filters.`,
          },
        });
      }

      const exportRows = rows.map((row) => ({
        referenceNo: row.referenceNo,
        status: row.status,
        channel: row.channel,
        priority: row.priority,
        subject: row.subject,
        submittedAt: row.submittedAt,
        categoryId: row.categoryId,
        orgUnitId: row.orgUnitId,
      }));

      const ext =
        record.format === ReportExportFormat.xlsx
          ? 'xlsx'
          : record.format === ReportExportFormat.pdf
            ? 'pdf'
            : 'csv';
      const storageKey = `reports/${exportId}.${ext}`;
      const storage = this.storageFactory.getStorage();
      await storage.ensureBuckets();

      let body: Buffer;
      let mimeType: string;
      if (record.format === ReportExportFormat.xlsx) {
        body = await complaintsToXlsxBuffer(exportRows);
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (record.format === ReportExportFormat.pdf) {
        body = await complaintsToPdfBuffer(exportRows);
        mimeType = 'application/pdf';
      } else {
        body = Buffer.from(complaintsToCsv(exportRows), 'utf-8');
        mimeType = 'text/csv; charset=utf-8';
      }

      await storage.putObject(getExportsBucket(), storageKey, body, {
        contentType: mimeType,
        originalName: `complaints-export.${ext}`,
      });

      const completedAt = new Date();
      await this.prisma.reportExport.update({
        where: { id: exportId },
        data: {
          status: ReportExportStatus.READY,
          storageKey,
          mimeType,
          rowCount: exportRows.length,
          completedAt,
        },
      });

      await this.audit.logEvent({
        eventType: AUDIT_EVENT.REPORT_EXPORT_COMPLETED,
        actorUserId: record.requestedById,
        entityType: 'report_export',
        entityId: exportId,
        correlationId,
        metadata: { rowCount: exportRows.length, format: record.format },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Report export failed';
      await this.prisma.reportExport.update({
        where: { id: exportId },
        data: {
          status: ReportExportStatus.FAILED,
          errorMessage: message.slice(0, 2000),
          completedAt: new Date(),
        },
      });
      await this.audit.logEvent({
        eventType: AUDIT_EVENT.REPORT_EXPORT_FAILED,
        actorUserId: record.requestedById,
        entityType: 'report_export',
        entityId: exportId,
        correlationId,
        metadata: { error: message },
      });
      throw error;
    }
  }

  async getExportStatus(
    exportId: string,
    userId: string,
    isSuperAdmin: boolean,
  ) {
    const record = await this.findExportForUser(exportId, userId, isSuperAdmin);
    return {
      id: record.id,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      completedAt: record.completedAt?.toISOString() ?? null,
      errorMessage: record.errorMessage,
    };
  }

  async getExportDownload(
    exportId: string,
    userId: string,
    isSuperAdmin: boolean,
  ) {
    const record = await this.findExportForUser(exportId, userId, isSuperAdmin);

    if (
      record.status === ReportExportStatus.PENDING ||
      record.status === ReportExportStatus.PROCESSING
    ) {
      return {
        status: record.status,
        url: null as string | null,
        expiresAt: null as string | null,
      };
    }

    if (record.status === ReportExportStatus.FAILED) {
      throw new NotFoundException({
        error: {
          code: 'export_failed',
          message: record.errorMessage ?? 'Export generation failed',
        },
      });
    }

    if (
      record.status === ReportExportStatus.EXPIRED ||
      (record.expiresAt && record.expiresAt.getTime() < Date.now())
    ) {
      throw new GoneException({
        error: {
          code: 'export_expired',
          message: 'Export has expired',
        },
      });
    }

    if (!record.storageKey) {
      throw new NotFoundException({
        error: { code: 'not_found', message: 'Export file not found' },
      });
    }

    const storage = this.storageFactory.getStorage();
    const signed = await storage.getSignedDownloadUrl(
      getExportsBucket(),
      record.storageKey,
      getPresignTtlSec(),
    );

    return {
      status: record.status,
      url: signed.url,
      expiresAt: signed.expiresAt,
    };
  }

  private async findExportForUser(
    exportId: string,
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<ReportExport> {
    const record = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });
    if (!record) {
      throw new NotFoundException({
        error: { code: 'not_found', message: 'Export not found' },
      });
    }
    if (!isSuperAdmin && record.requestedById !== userId) {
      throw new NotFoundException({
        error: { code: 'not_found', message: 'Export not found' },
      });
    }
    return record;
  }
}
