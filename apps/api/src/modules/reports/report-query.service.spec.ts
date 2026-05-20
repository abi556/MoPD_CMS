import { Test } from '@nestjs/testing';
import { ComplaintStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryService } from './report-query.service';
import { normalizeReportFilters } from './report-filters';

describe('ReportQueryService', () => {
  let service: ReportQueryService;
  const prisma = {
    complaint: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    complaintSla: { findMany: jest.fn() },
    complaintHistory: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportQueryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ReportQueryService);
    jest.clearAllMocks();
  });

  const filters = normalizeReportFilters({
    from: '2026-05-01',
    to: '2026-05-03',
    bucket: 'day',
  });

  it('aggregates volume by status and bucket', async () => {
    prisma.complaint.findMany.mockResolvedValue([
      {
        status: ComplaintStatus.SUBMITTED,
        submittedAt: new Date('2026-05-01T10:00:00Z'),
      },
      {
        status: ComplaintStatus.CLOSED,
        submittedAt: new Date('2026-05-02T10:00:00Z'),
      },
    ]);

    const result = await service.getVolumeDashboard(filters);
    expect(result.buckets).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
    expect(result.meta.total).toBe(2);
    const submitted = result.series.find(
      (s) => s.status === ComplaintStatus.SUBMITTED,
    );
    expect(submitted?.counts[0]).toBe(1);
  });

  it('computes channel counts', async () => {
    prisma.complaint.groupBy.mockResolvedValue([
      { channel: 'WEB', _count: { _all: 3 } },
      { channel: 'EMAIL', _count: { _all: 1 } },
    ]);

    const result = await service.getChannelsDashboard(filters);
    expect(result.channels).toHaveLength(2);
    expect(result.meta.total).toBe(4);
  });
});
