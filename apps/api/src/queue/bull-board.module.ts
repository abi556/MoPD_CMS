import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUE_REPORT_EXPORT, QUEUE_SLA_MONITOR } from './queue.constants';
import { basicAuthMiddleware } from './bull-board.middleware';

/**
 * Mounts the Bull Board admin UI at `/admin/queues`.
 *
 * Why HTTP Basic Auth instead of JWT?
 * - Bull Board renders an HTML SPA + static assets, not a single JSON endpoint.
 *   Protecting it with the existing JwtAuthGuard would require wiring guards
 *   into Express middleware, which fights NestJS' architecture and breaks the
 *   asset URLs that the SPA generates relative to its mount point.
 * - HTTP Basic Auth is the standard for admin tools (Prometheus, Grafana,
 *   pgAdmin, RabbitMQ Mgmt, Hangfire, etc.) and works natively with browsers.
 * - In production, this endpoint should additionally be IP-restricted at the
 *   reverse proxy or VPN level.
 *
 * Disabled entirely in `test` mode (no real Redis, would only confuse tests).
 */
const isTest = process.env.NODE_ENV === 'test';

@Module({
  imports: isTest
    ? []
    : [
        BullBoardModule.forRoot({
          route: '/admin/queues',
          adapter: ExpressAdapter,
          middleware: basicAuthMiddleware,
        }),
        BullBoardModule.forFeature({
          name: QUEUE_SLA_MONITOR,
          adapter: BullMQAdapter,
        }),
        BullBoardModule.forFeature({
          name: QUEUE_REPORT_EXPORT,
          adapter: BullMQAdapter,
        }),
      ],
})
export class BullBoardAdminModule {}
