import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ReportExportFormat, ReportExportStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ReportQueryService } from './report-query.service';
import { AuditService } from '../audit/audit.service';
import { DocumentStorageFactory } from '../documents/storage/document-storage.factory';
import { PrismaService } from '../../prisma/prisma.service';
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import { RedisHealthService } from '../../queue/redis-health.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const prisma = {
    reportExport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const reportQuery = {
    fetchComplaintExportRows: jest.fn(),
  };
  const audit = { logEvent: jest.fn() };
  const storage = {
    ensureBuckets: jest.fn(),
    putObject: jest.fn(),
    getSignedDownloadUrl: jest.fn(),
  };
  const storageFactory = { getStorage: () => storage };
  const queue = { add: jest.fn(), getJobCounts: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReportQueryService, useValue: reportQuery },
        { provide: AuditService, useValue: audit },
        { provide: DocumentStorageFactory, useValue: storageFactory },
        { provide: 'BullQueue_report-export', useValue: queue },
        {
          provide: RedisHealthService,
          useValue: { ping: jest.fn().mockResolvedValue({ status: 'ok', latencyMs: 1 }) },
        },
        {
          provide: InAppNotificationService,
          useValue: { notify: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();
    service = moduleRef.get(ReportsService);
    jest.clearAllMocks();
  });

  it('returns 404 for missing export download', async () => {
    prisma.reportExport.findUnique.mockResolvedValue(null);
    await expect(
      service.getExportDownload('missing', 'user-1', true),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns presigned url when export is ready', async () => {
    prisma.reportExport.findUnique.mockResolvedValue({
      id: 'exp-1',
      requestedById: 'user-1',
      status: ReportExportStatus.READY,
      storageKey: 'reports/exp-1.csv',
      expiresAt: new Date(Date.now() + 60_000),
    });
    storage.getSignedDownloadUrl.mockResolvedValue({
      url: 'https://minio/signed',
      expiresAt: new Date().toISOString(),
    });

    const result = await service.getExportDownload('exp-1', 'user-1', false);
    expect(result.url).toBe('https://minio/signed');
  });

  it('creates export and processes in test env', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    prisma.reportExport.create.mockResolvedValue({
      id: 'exp-2',
      requestedById: 'user-1',
      format: ReportExportFormat.csv,
      status: ReportExportStatus.PENDING,
      filters: {},
      createdAt: new Date(),
    });
    prisma.reportExport.findUnique.mockResolvedValue({
      id: 'exp-2',
      requestedById: 'user-1',
      format: ReportExportFormat.csv,
      status: ReportExportStatus.PENDING,
      filters: {
        from: '2026-05-01T00:00:00.000Z',
        to: '2026-05-03T23:59:59.999Z',
        bucket: 'day',
      },
    });
    prisma.reportExport.update.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'exp-2',
        status: data.status ?? ReportExportStatus.READY,
      }),
    );
    reportQuery.fetchComplaintExportRows.mockResolvedValue([]);

    await service.createExport(
      {
        format: 'csv',
        reportType: 'complaints',
        from: '2026-05-01',
        to: '2026-05-03',
      },
      'user-1',
    );

    expect(audit.logEvent).toHaveBeenCalled();
    expect(storage.putObject).toHaveBeenCalled();
    process.env.NODE_ENV = prev;
  });
});
