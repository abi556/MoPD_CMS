import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';

type RedisCtor = new (...args: unknown[]) => Redis;

function buildConnection(): Redis | Record<string, unknown> {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedisMock = require('ioredis-mock') as RedisCtor;
    return new IORedisMock();
  }
  return {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    lazyConnect: true,
    enableOfflineQueue: false,
  };
}

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: buildConnection(),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
