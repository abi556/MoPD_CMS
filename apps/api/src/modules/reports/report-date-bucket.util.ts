import type { ReportDateBucket } from './report-filters';
import { startOfUtcDay } from './report-filters';

export function truncateToBucket(date: Date, bucket: ReportDateBucket): Date {
  const d = startOfUtcDay(date);
  if (bucket === 'day') {
    return d;
  }
  if (bucket === 'week') {
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
  }
  d.setUTCDate(1);
  return d;
}

export function formatBucketLabel(
  date: Date,
  bucket: ReportDateBucket,
): string {
  const truncated = truncateToBucket(date, bucket);
  if (bucket === 'month') {
    const y = truncated.getUTCFullYear();
    const m = String(truncated.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return truncated.toISOString().slice(0, 10);
}

export function generateBucketLabels(
  from: Date,
  to: Date,
  bucket: ReportDateBucket,
): string[] {
  const labels: string[] = [];
  const cursor = truncateToBucket(from, bucket);
  const end = truncateToBucket(to, bucket);
  while (cursor.getTime() <= end.getTime()) {
    labels.push(formatBucketLabel(cursor, bucket));
    if (bucket === 'day') {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else if (bucket === 'week') {
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    } else {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  return labels;
}

export function bucketIndexForDate(
  labels: string[],
  date: Date,
  bucket: ReportDateBucket,
): number {
  const label = formatBucketLabel(date, bucket);
  return labels.indexOf(label);
}
