import { Module, Provider } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { NotificationDispatchProcessor } from './notification-dispatch.processor';
import { NotificationDeliveriesAdminController } from './notification-deliveries-admin.controller';
import { NotificationTemplatesAdminController } from './notification-templates-admin.controller';
import { NotificationsService } from './notifications.service';

const workerProviders: Provider[] =
  process.env.NODE_ENV === 'test' ? [] : [NotificationDispatchProcessor];

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    NotificationDeliveriesAdminController,
    NotificationTemplatesAdminController,
  ],
  providers: [
    NotificationsService,
    ConsoleEmailProvider,
    SmtpEmailProvider,
    ResendEmailProvider,
    EmailProviderFactory,
    ...workerProviders,
  ],
  exports: [NotificationsService, EmailProviderFactory],
})
export class NotificationsModule {}
