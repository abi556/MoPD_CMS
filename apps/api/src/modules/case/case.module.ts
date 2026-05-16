import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CaseCollaborationController } from './case-collaboration.controller';
import { CaseCollaborationService } from './case-collaboration.service';

/**
 * SDS §5.3.6 CaseModule — internal case collaboration (notes, tasks).
 * Routes remain nested under complaints per API contract.
 */
@Module({
  imports: [AuditModule],
  controllers: [CaseCollaborationController],
  providers: [CaseCollaborationService],
  exports: [CaseCollaborationService],
})
export class CaseModule {}
