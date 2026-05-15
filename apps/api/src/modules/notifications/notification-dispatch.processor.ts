import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NOTIFICATION_DISPATCH } from '../../queue/queue.constants';
import { NotificationsService } from './notifications.service';

@Processor(QUEUE_NOTIFICATION_DISPATCH)
export class NotificationDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDispatchProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<{ deliveryId: string }>): Promise<void> {
    const deliveryId = job.data.deliveryId;
    this.logger.debug(`Dispatching notification ${deliveryId} (job ${job.id})`);
    await this.notificationsService.processDelivery(deliveryId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Notification dispatch job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
