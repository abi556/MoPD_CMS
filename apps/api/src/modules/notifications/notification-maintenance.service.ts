import { Injectable, Logger } from '@nestjs/common';
import { UserNotificationSeverity, UserNotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INBOX_LINK,
  INBOX_MESSAGE_KEY,
  isoWeekDedupKey,
} from './in-app-notification.paths';
import { InAppNotificationService } from './in-app-notification.service';

@Injectable()
export class NotificationMaintenanceService {
  private readonly logger = new Logger(NotificationMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppNotifications: InAppNotificationService,
  ) {}

  async sendWeeklyMfaReminders(): Promise<{ sent: number }> {
    const weekKey = isoWeekDedupKey();
    const users = await this.prisma.user.findMany({
      where: { isActive: true, mfaEnabled: false },
      select: { id: true },
    });

    let sent = 0;
    for (const user of users) {
      const result = await this.inAppNotifications.notify({
        userId: user.id,
        type: UserNotificationType.security_mfa_reminder,
        severity: UserNotificationSeverity.warning,
        messageKey: INBOX_MESSAGE_KEY.securityMfaReminder,
        link: INBOX_LINK.profileMfa,
        entityType: 'user',
        entityId: user.id,
        dedupKey: `mfa_reminder:${user.id}:${weekKey}`,
      });
      if (result) {
        sent += 1;
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastMfaReminderAt: new Date() },
        });
      }
    }

    this.logger.log(`MFA weekly reminders sent: ${sent}/${users.length}`);
    return { sent };
  }
}
