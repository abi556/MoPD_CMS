import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QUEUE_SLA_MONITOR } from './queue.constants';

export interface RedisHealthStatus {
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number | null;
  error?: string;
}

/**
 * Cheap PING-based health check for the Redis connection that backs BullMQ.
 *
 * In tests `ioredis-mock` answers PING happily, so the same code path runs
 * regardless of environment. We use the existing `sla-monitor` queue rather
 * than a dedicated client to avoid spinning up a second connection.
 */
@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);

  constructor(
    @InjectQueue(QUEUE_SLA_MONITOR) private readonly probeQueue: Queue,
  ) {}

  async ping(): Promise<RedisHealthStatus> {
    const started = Date.now();
    try {
      const client = await this.probeQueue.client;
      const reply = await client.ping();
      const latencyMs = Date.now() - started;
      if (reply !== 'PONG') {
        return { status: 'degraded', latencyMs, error: `Unexpected reply: ${reply}` };
      }
      return { status: 'ok', latencyMs };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis health check failed: ${message}`);
      return { status: 'down', latencyMs: null, error: message };
    }
  }
}
