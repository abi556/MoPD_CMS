import { InjectQueue } from '@nestjs/bullmq';
import { Module, OnModuleInit, Provider } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { QUEUE_NOTIFICATION_MAINTENANCE } from '../../queue/queue.constants';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { NotificationDispatchProcessor } from './notification-dispatch.processor';
import { NotificationDeliveriesAdminController } from './notification-deliveries-admin.controller';
import { NotificationTemplatesAdminController } from './notification-templates-admin.controller';
import { NotificationsService } from './notifications.service';
import { InAppNotificationService } from './in-app-notification.service';
import { UserNotificationsController } from './user-notifications.controller';
import { NotificationMaintenanceService } from './notification-maintenance.service';
import {
  NOTIFICATION_MAINTENANCE_JOB_ID,
  NotificationMaintenanceProcessor,
} from './notification-maintenance.processor';

const workerProviders: Provider[] =
  process.env.NODE_ENV === 'test'
    ? []
    : [NotificationDispatchProcessor, NotificationMaintenanceProcessor];

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    NotificationDeliveriesAdminController,
    NotificationTemplatesAdminController,
    UserNotificationsController,
  ],
  providers: [
    NotificationsService,
    InAppNotificationService,
    NotificationMaintenanceService,
    ConsoleEmailProvider,
    SmtpEmailProvider,
    ResendEmailProvider,
    EmailProviderFactory,
    ...workerProviders,
  ],
  exports: [
    NotificationsService,
    EmailProviderFactory,
    InAppNotificationService,
  ],
})
export class NotificationsModule implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_NOTIFICATION_MAINTENANCE)
    private readonly maintenanceQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    // Weekly MFA reminder — Monday 09:00 Africa/Addis_Ababa
    await this.maintenanceQueue.add(
      'mfa-reminders',
      {},
      {
        jobId: NOTIFICATION_MAINTENANCE_JOB_ID,
        repeat: { pattern: '0 9 * * 1', tz: 'Africa/Addis_Ababa' },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
