import {
  formatBucketLabel,
  generateBucketLabels,
  truncateToBucket,
} from './report-date-bucket.util';
import { assertValidReportRange } from './report-filters';

describe('report-date-bucket.util', () => {
  it('formats day bucket labels', () => {
    expect(formatBucketLabel(new Date('2026-05-15T14:00:00Z'), 'day')).toBe(
      '2026-05-15',
    );
  });

  it('formats month bucket labels', () => {
    expect(formatBucketLabel(new Date('2026-05-15T14:00:00Z'), 'month')).toBe(
      '2026-05',
    );
  });

  it('generates consecutive day labels', () => {
    const labels = generateBucketLabels(
      new Date('2026-05-01'),
      new Date('2026-05-03'),
      'day',
    );
    expect(labels).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
  });

  it('truncates to Monday for week buckets', () => {
    const monday = truncateToBucket(new Date('2026-05-14T12:00:00Z'), 'week');
    expect(monday.getUTCDay()).toBe(1);
  });
});

describe('report-filters range validation', () => {
  it('rejects inverted ranges', () => {
    expect(() =>
      assertValidReportRange(new Date('2026-06-01'), new Date('2026-05-01')),
    ).toThrow();
  });
});
