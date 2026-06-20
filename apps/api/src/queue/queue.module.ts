import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  QUEUE_DOCUMENT_SCAN,
  QUEUE_NOTIFICATION_DISPATCH,
  QUEUE_NOTIFICATION_MAINTENANCE,
  QUEUE_REPORT_EXPORT,
  QUEUE_SLA_MONITOR,
} from './queue.constants';
import {
  buildRedisConnectionOptions,
  waitUntilRedisReachable,
} from './redis-connection';
import { RedisHealthService } from './redis-health.service';

type RedisCtor = new (...args: unknown[]) => Redis;

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: async () => {
        if (process.env.NODE_ENV === 'test') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const IORedisMock = require('ioredis-mock') as RedisCtor;
          return { connection: new IORedisMock() };
        }

        await waitUntilRedisReachable();
        return { connection: buildRedisConnectionOptions() };
      },
    }),
    BullModule.registerQueue({ name: QUEUE_SLA_MONITOR }),
    BullModule.registerQueue({ name: QUEUE_NOTIFICATION_DISPATCH }),
    BullModule.registerQueue({ name: QUEUE_NOTIFICATION_MAINTENANCE }),
    BullModule.registerQueue({ name: QUEUE_DOCUMENT_SCAN }),
    BullModule.registerQueue({ name: QUEUE_REPORT_EXPORT }),
  ],
  providers: [RedisHealthService],
  exports: [BullModule, RedisHealthService],
})
export class QueueModule {}
