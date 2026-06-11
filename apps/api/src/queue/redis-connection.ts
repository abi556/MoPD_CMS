import Redis from 'ioredis';

export function getRedisUrl(): string {
  return process.env.REDIS_URL ?? 'redis://localhost:6379';
}

export function getRedisMaxRetries(): number {
  return parseInt(process.env.REDIS_MAX_RETRIES ?? '20', 10);
}

/** Shared ioredis options for BullMQ and direct Redis clients. */
export function buildRedisConnectionOptions(): Record<string, unknown> {
  const maxRetries = getRedisMaxRetries();

  return {
    url: getRedisUrl(),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    enableOfflineQueue: false,
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

/**
 * Block API bootstrap until Redis accepts PING.
 * Prevents BullMQ workers from spamming "Stream isn't writeable" during docker startup.
 */
export async function waitUntilRedisReachable(
  timeoutMs = 30_000,
): Promise<void> {
  const started = Date.now();
  let lastError: Error | undefined;

  while (Date.now() - started < timeoutMs) {
    const client = new Redis({
      ...buildRedisConnectionOptions(),
      lazyConnect: true,
    });

    try {
      await client.connect();
      const reply = await client.ping();
      await client.quit();
      if (reply === 'PONG') {
        return;
      }
      lastError = new Error(`Unexpected Redis PING reply: ${String(reply)}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      try {
        client.disconnect();
      } catch {
        // ignore cleanup errors while retrying
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `Redis not reachable at ${getRedisUrl()} within ${timeoutMs}ms: ${lastError?.message ?? 'unknown error'}`,
  );
}
