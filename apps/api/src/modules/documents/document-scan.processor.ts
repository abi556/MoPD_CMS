import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_DOCUMENT_SCAN } from '../../queue/queue.constants';
import { DocumentsService } from './documents.service';

@Processor(QUEUE_DOCUMENT_SCAN)
export class DocumentScanProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentScanProcessor.name);

  constructor(private readonly documentsService: DocumentsService) {
    super();
  }

  async process(
    job: Job<{ documentId: string; correlationId?: string }>,
  ): Promise<void> {
    const { documentId, correlationId } = job.data;
    this.logger.debug(`Scanning document ${documentId} (job ${job.id})`);
    await this.documentsService.processScan(documentId, correlationId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Document scan job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
