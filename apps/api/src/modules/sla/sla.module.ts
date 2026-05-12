import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Module, OnModuleInit, Provider } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AuditModule } from '../audit/audit.module';
import { QUEUE_SLA_MONITOR } from '../../queue/queue.constants';
import {
  SlaMonitorProcessor,
  SLA_MONITOR_JOB_ID,
} from './sla-monitor.processor';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';

// In test mode, skip registering the BullMQ Worker so tests don't need a real Redis
const workerProviders: Provider[] =
  process.env.NODE_ENV === 'test' ? [] : [SlaMonitorProcessor];

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_SLA_MONITOR }), AuditModule],
  providers: [SlaService, ...workerProviders],
  controllers: [SlaController],
  exports: [SlaService],
})
export class SlaModule implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_SLA_MONITOR) private readonly slaQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    const intervalMs = parseInt(
      process.env.SLA_MONITOR_INTERVAL_MS ?? '300000',
      10,
    );
    // Upsert the repeatable job — idempotent across restarts via fixed jobId
    await this.slaQueue.add(
      'evaluate',
      {},
      {
        jobId: SLA_MONITOR_JOB_ID,
        repeat: { every: intervalMs },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
