import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuditModule],
  controllers: [AdminController],
  providers: [RolesGuard],
})
export class AdminModule {}
