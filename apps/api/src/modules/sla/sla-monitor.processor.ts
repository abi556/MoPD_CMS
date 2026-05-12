import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_SLA_MONITOR } from '../../queue/queue.constants';
import { SlaService } from './sla.service';

export const SLA_MONITOR_JOB_ID = 'sla-monitor-repeatable';

@Processor(QUEUE_SLA_MONITOR)
export class SlaMonitorProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaMonitorProcessor.name);

  constructor(private readonly slaService: SlaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Running SLA monitor evaluation (job ${job.id})`);
    await this.slaService.evaluateActive();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `SLA monitor job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
