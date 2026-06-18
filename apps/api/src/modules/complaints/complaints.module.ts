import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { SlaModule } from '../sla/sla.module';
import { ComplaintAccessModule } from './complaint-access.module';
import { ComplaintsController } from './complaints.controller';
import { ComplaintRecoveryInquiryService } from './complaint-recovery-inquiry.service';
import { ComplaintRecoveryService } from './complaint-recovery.service';
import { ComplaintsService } from './complaints.service';
import { WorkflowPolicyService } from './workflow-policy.service';

@Module({
  imports: [
    AuditModule,
    ComplaintAccessModule,
    DocumentsModule,
    ReferenceDataModule,
    forwardRef(() => SlaModule),
    NotificationsModule,
  ],
  controllers: [ComplaintsController],
  providers: [
    ComplaintsService,
    ComplaintRecoveryService,
    ComplaintRecoveryInquiryService,
    WorkflowPolicyService,
  ],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
