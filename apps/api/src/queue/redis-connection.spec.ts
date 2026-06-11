import { buildRedisConnectionOptions } from './redis-connection';

describe('redis-connection', () => {
  it('builds BullMQ-compatible options', () => {
    const options = buildRedisConnectionOptions();
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.lazyConnect).toBe(false);
    expect(options.enableOfflineQueue).toBe(false);
  });
});
