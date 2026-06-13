import { Module } from '@nestjs/common';
import { ComplaintAccessService } from './complaint-access.service';

@Module({
  providers: [ComplaintAccessService],
  exports: [ComplaintAccessService],
})
export class ComplaintAccessModule {}
