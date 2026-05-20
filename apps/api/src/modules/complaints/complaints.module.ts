import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SlaModule } from '../sla/sla.module';
import { ComplaintAccessService } from './complaint-access.service';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { WorkflowPolicyService } from './workflow-policy.service';

@Module({
  imports: [AuditModule, forwardRef(() => SlaModule), NotificationsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ComplaintAccessService, WorkflowPolicyService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
