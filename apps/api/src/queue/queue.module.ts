import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  QUEUE_DOCUMENT_SCAN,
  QUEUE_NOTIFICATION_DISPATCH,
  QUEUE_REPORT_EXPORT,
  QUEUE_SLA_MONITOR,
} from './queue.constants';
import { RedisHealthService } from './redis-health.service';

type RedisCtor = new (...args: unknown[]) => Redis;

/**
 * Build the Redis connection options for BullMQ.
 *
 * - `test`: uses `ioredis-mock` so unit/e2e tests run without a real Redis.
 * - `development`/`production`: uses ioredis driven by `REDIS_URL`.
 *   - `rediss://` URLs automatically enable TLS in ioredis.
 *   - Connections are lazy with a bounded retry strategy so a slow Redis
 *     start doesn't crash the API; jobs that try to enqueue while Redis is
 *     offline will fail fast rather than queueing in process memory.
 */
function buildConnection(): Redis | Record<string, unknown> {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedisMock = require('ioredis-mock') as RedisCtor;
    return new IORedisMock();
  }

  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES ?? '20', 10);

  return {
    url,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times: number): number | null => {
      if (times > maxRetries) return null;
      return Math.min(times * 200, 5000);
    },
    reconnectOnError: (err: Error): boolean => {
      const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
      return targetErrors.some((t) => err.message.includes(t));
    },
  };
}

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: buildConnection(),
    }),
    BullModule.registerQueue({ name: QUEUE_SLA_MONITOR }),
    BullModule.registerQueue({ name: QUEUE_NOTIFICATION_DISPATCH }),
    BullModule.registerQueue({ name: QUEUE_DOCUMENT_SCAN }),
    BullModule.registerQueue({ name: QUEUE_REPORT_EXPORT }),
  ],
  providers: [RedisHealthService],
  exports: [BullModule, RedisHealthService],
})
export class QueueModule {}
