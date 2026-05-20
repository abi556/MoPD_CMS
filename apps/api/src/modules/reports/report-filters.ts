import { UnprocessableEntityException } from '@nestjs/common';

export type ReportDateBucket = 'day' | 'week' | 'month';

export interface ReportFilters {
  from: Date;
  to: Date;
  bucket: ReportDateBucket;
  categoryId?: string;
  orgUnitId?: string;
}

const MAX_RANGE_DAYS = 366;

export function endOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function assertValidReportRange(from: Date, to: Date): void {
  if (from.getTime() > to.getTime()) {
    throw new UnprocessableEntityException({
      error: {
        code: 'invalid_date_range',
        message: 'from must be on or before to',
      },
    });
  }
  const spanMs = endOfUtcDay(to).getTime() - startOfUtcDay(from).getTime();
  const maxMs = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (spanMs > maxMs) {
    throw new UnprocessableEntityException({
      error: {
        code: 'report_range_too_large',
        message: `Date range must not exceed ${MAX_RANGE_DAYS} days`,
      },
    });
  }
}

export function normalizeReportFilters(input: {
  from: string | Date;
  to: string | Date;
  bucket?: ReportDateBucket;
  categoryId?: string;
  orgUnitId?: string;
}): ReportFilters {
  const from = startOfUtcDay(
    input.from instanceof Date ? input.from : new Date(input.from),
  );
  const to = endOfUtcDay(
    input.to instanceof Date ? input.to : new Date(input.to),
  );
  assertValidReportRange(from, to);
  return {
    from,
    to,
    bucket: input.bucket ?? 'day',
    categoryId: input.categoryId,
    orgUnitId: input.orgUnitId,
  };
}

export function complaintWhereForFilters(filters: ReportFilters): {
  submittedAt: { gte: Date; lte: Date };
  categoryId?: string;
  orgUnitId?: string;
} {
  const where: {
    submittedAt: { gte: Date; lte: Date };
    categoryId?: string;
    orgUnitId?: string;
  } = {
    submittedAt: { gte: filters.from, lte: filters.to },
  };
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.orgUnitId) {
    where.orgUnitId = filters.orgUnitId;
  }
  return where;
}
