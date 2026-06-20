import { BullModule } from '@nestjs/bullmq';
import { Module, Provider } from '@nestjs/common';
import { QUEUE_REPORT_EXPORT } from '../../queue/queue.constants';
import { AuditModule } from '../audit/audit.module';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportExportProcessor } from './report-export.processor';
import { ReportQueryService } from './report-query.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

const workerProviders: Provider[] =
  process.env.NODE_ENV === 'test' ? [] : [ReportExportProcessor];

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    DocumentsModule,
    NotificationsModule,
    BullModule.registerQueue({ name: QUEUE_REPORT_EXPORT }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportQueryService, ...workerProviders],
  exports: [ReportsService],
})
export class ReportsModule {}
