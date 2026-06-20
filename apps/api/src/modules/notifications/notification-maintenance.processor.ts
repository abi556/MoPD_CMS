import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NOTIFICATION_MAINTENANCE } from '../../queue/queue.constants';
import { NotificationMaintenanceService } from './notification-maintenance.service';

export const NOTIFICATION_MAINTENANCE_JOB_ID = 'notification-maintenance-weekly';

@Processor(QUEUE_NOTIFICATION_MAINTENANCE)
export class NotificationMaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationMaintenanceProcessor.name);

  constructor(
    private readonly maintenanceService: NotificationMaintenanceService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(
      `Running notification maintenance (job ${job.id}, name ${job.name})`,
    );
    if (job.name === 'mfa-reminders') {
      await this.maintenanceService.sendWeeklyMfaReminders();
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Notification maintenance job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
