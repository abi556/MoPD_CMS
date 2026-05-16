import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SlaModule } from '../sla/sla.module';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  imports: [AuditModule, forwardRef(() => SlaModule), NotificationsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
