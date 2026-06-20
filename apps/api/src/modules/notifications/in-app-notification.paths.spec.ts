import { isoWeekDedupKey } from './in-app-notification.paths';

describe('isoWeekDedupKey', () => {
  it('returns stable ISO week bucket', () => {
    expect(isoWeekDedupKey(new Date('2026-06-18T12:00:00.000Z'))).toMatch(
      /^\d{4}-W\d{2}$/,
    );
  });
});
