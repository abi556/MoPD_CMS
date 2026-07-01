import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ContactService } from './contact.service';
import { ConsentService } from './consent.service';
import { AnalyticsService } from './analytics.service';
import { PlatformController } from './platform.controller';

@Module({
  imports: [AuditModule, NotificationsModule, PrismaModule],
  controllers: [PlatformController],
  providers: [ContactService, ConsentService, AnalyticsService],
})
export class PlatformModule {}
