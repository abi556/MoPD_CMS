import { Module, Provider } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ComplaintAccessModule } from '../complaints/complaint-access.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentScanProcessor } from './document-scan.processor';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ClamAvScanner } from './scanners/clamav-virus.scanner';
import { NoOpVirusScanner } from './scanners/noop-virus.scanner';
import { VirusScannerFactory } from './scanners/virus-scanner.factory';
import { DocumentStorageFactory } from './storage/document-storage.factory';
import { MemoryDocumentStorage } from './storage/memory-document.storage';
import { MinioDocumentStorage } from './storage/minio-document.storage';

const workerProviders: Provider[] =
  process.env.NODE_ENV === 'test' ? [] : [DocumentScanProcessor];

@Module({
  imports: [PrismaModule, AuditModule, ComplaintAccessModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    MemoryDocumentStorage,
    MinioDocumentStorage,
    DocumentStorageFactory,
    NoOpVirusScanner,
    ClamAvScanner,
    VirusScannerFactory,
    ...workerProviders,
  ],
  exports: [DocumentsService, DocumentStorageFactory, VirusScannerFactory],
})
export class DocumentsModule {}
