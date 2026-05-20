import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_REPORT_EXPORT } from '../../queue/queue.constants';
import { ReportsService } from './reports.service';

@Processor(QUEUE_REPORT_EXPORT)
export class ReportExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportExportProcessor.name);

  constructor(private readonly reportsService: ReportsService) {
    super();
  }

  async process(
    job: Job<{ exportId: string; correlationId?: string }>,
  ): Promise<void> {
    const { exportId, correlationId } = job.data;
    this.logger.debug(`Processing report export ${exportId} (job ${job.id})`);
    await this.reportsService.processExport(exportId, correlationId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Report export job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
