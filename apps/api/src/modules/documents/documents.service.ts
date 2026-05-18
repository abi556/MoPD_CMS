import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DocumentScanStatus, type Document } from '@prisma/client';
import type { Queue } from 'bullmq';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_DOCUMENT_SCAN } from '../../queue/queue.constants';
import {
  buildStorageKey,
  getAllowedMimeTypes,
  getDocumentMaxBytes,
  getLiveBucket,
  getPresignTtlSec,
  getQuarantineBucket,
  isExtensionBlocked,
  sanitizePostgresText,
} from './document.config';
import { DocumentStorageFactory } from './storage/document-storage.factory';
import { VirusScannerFactory } from './scanners/virus-scanner.factory';
import type { UploadedMulterFile } from './types/uploaded-file';

export const DOCUMENT_SCAN_JOB = 'scan';

export interface DocumentRecord {
  id: string;
  complaintId: string;
  ownerUserId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: DocumentScanStatus;
  storageKey: string;
  scannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class DocumentsService implements OnModuleInit {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly syncInTest =
    process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageFactory: DocumentStorageFactory,
    private readonly scannerFactory: VirusScannerFactory,
    @InjectQueue(QUEUE_DOCUMENT_SCAN)
    private readonly scanQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.syncInTest) {
      return;
    }
    try {
      await this.storageFactory.getStorage().ensureBuckets();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`MinIO bucket bootstrap skipped: ${message}`);
    }
  }

  async upload(
    complaintId: string,
    ownerUserId: string,
    file: UploadedMulterFile,
    correlationId?: string,
  ): Promise<DocumentRecord> {
    await this.assertComplaintExists(complaintId);
    this.validateUpload(file);

    const storage = this.storageFactory.getStorage();
    const quarantineBucket = getQuarantineBucket();
    const documentId = randomUUID();
    const storageKey = buildStorageKey(complaintId, documentId);
    const quarantineKey = `${storageKey}/quarantine`;

    await storage.putObject(quarantineBucket, quarantineKey, file.buffer, {
      contentType: file.mimetype,
      originalName: file.originalname,
    });

    const row = await this.prisma.document.create({
      data: {
        id: documentId,
        complaintId,
        ownerUserId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        scanStatus: DocumentScanStatus.PENDING,
        storageKey,
        quarantineKey,
      },
    });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.DOCUMENT_UPLOADED,
      actorUserId: ownerUserId,
      entityType: 'document',
      entityId: row.id,
      correlationId,
      metadata: {
        complaintId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });

    if (this.syncInTest) {
      await this.processScan(row.id, correlationId);
      const updated = await this.findDocumentOrThrow(row.id);
      return this.toRecord(updated);
    }

    await this.scanQueue.add(
      DOCUMENT_SCAN_JOB,
      { documentId: row.id, correlationId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return this.toRecord(row);
  }

  async getMetadata(id: string): Promise<DocumentRecord> {
    const row = await this.findDocumentOrThrow(id);
    return this.toRecord(row);
  }

  async getDownloadUrl(
    id: string,
    actorUserId: string,
    correlationId?: string,
  ): Promise<{ url: string; expiresAt: string }> {
    const row = await this.findDocumentOrThrow(id);

    if (row.scanStatus === DocumentScanStatus.INFECTED) {
      throw new ConflictException(
        'Document failed virus scan and cannot be downloaded',
      );
    }
    if (
      row.scanStatus === DocumentScanStatus.PENDING ||
      row.scanStatus === DocumentScanStatus.SCANNING ||
      row.scanStatus === DocumentScanStatus.FAILED
    ) {
      throw new ConflictException(
        `Document is not available for download (status: ${row.scanStatus})`,
      );
    }
    if (!row.liveKey) {
      throw new ConflictException('Document has no live storage key');
    }

    const ttlSec = getPresignTtlSec();
    const signed = await this.storageFactory
      .getStorage()
      .getSignedDownloadUrl(getLiveBucket(), row.liveKey, ttlSec);

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.DOCUMENT_DOWNLOAD_REQUESTED,
      actorUserId,
      entityType: 'document',
      entityId: row.id,
      correlationId,
      metadata: { complaintId: row.complaintId },
    });

    return signed;
  }

  async delete(
    id: string,
    actorUserId: string,
    correlationId?: string,
  ): Promise<void> {
    const row = await this.findDocumentOrThrow(id);
    const storage = this.storageFactory.getStorage();
    const quarantineBucket = getQuarantineBucket();
    const liveBucket = getLiveBucket();

    if (row.quarantineKey) {
      try {
        await storage.removeObject(quarantineBucket, row.quarantineKey);
      } catch {
        // object may already be removed after scan
      }
    }
    if (row.liveKey) {
      try {
        await storage.removeObject(liveBucket, row.liveKey);
      } catch {
        // best effort
      }
    }

    await this.prisma.document.delete({ where: { id: row.id } });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.DOCUMENT_DELETED,
      actorUserId,
      entityType: 'document',
      entityId: id,
      correlationId,
      metadata: { complaintId: row.complaintId },
    });
  }

  async processScan(documentId: string, correlationId?: string): Promise<void> {
    const row = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!row || row.scanStatus !== DocumentScanStatus.PENDING) {
      return;
    }

    const storage = this.storageFactory.getStorage();
    const scanner = this.scannerFactory.getScanner();
    const quarantineBucket = getQuarantineBucket();
    const liveBucket = getLiveBucket();

    await this.prisma.document.update({
      where: { id: documentId },
      data: { scanStatus: DocumentScanStatus.SCANNING },
    });

    if (!row.quarantineKey) {
      await this.markFailed(
        documentId,
        'Missing quarantine key',
        correlationId,
      );
      return;
    }

    try {
      const buffer = await storage.getObject(
        quarantineBucket,
        row.quarantineKey,
      );
      const result = await scanner.scan(buffer);

      if (!result.clean) {
        await storage.removeObject(quarantineBucket, row.quarantineKey);
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            scanStatus: DocumentScanStatus.INFECTED,
            quarantineKey: null,
            scanError:
              sanitizePostgresText(result.signature ?? 'infected') ??
              'infected',
            scannedAt: new Date(),
          },
        });
        await this.auditService.logEvent({
          eventType: AUDIT_EVENT.DOCUMENT_INFECTED,
          actorUserId: row.ownerUserId,
          entityType: 'document',
          entityId: documentId,
          correlationId,
          metadata: {
            complaintId: row.complaintId,
            signature: result.signature
              ? sanitizePostgresText(result.signature)
              : null,
          },
        });
        return;
      }

      const liveKey = row.storageKey;
      await storage.copyObject(
        quarantineBucket,
        row.quarantineKey,
        liveBucket,
        liveKey,
      );
      await storage.removeObject(quarantineBucket, row.quarantineKey);

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          scanStatus: DocumentScanStatus.CLEAN,
          liveKey,
          quarantineKey: null,
          scanError: null,
          scannedAt: new Date(),
        },
      });

      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.DOCUMENT_SCAN_COMPLETED,
        actorUserId: row.ownerUserId,
        entityType: 'document',
        entityId: documentId,
        correlationId,
        metadata: { complaintId: row.complaintId },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Document scan ${documentId} failed: ${message}`);
      await this.markFailed(
        documentId,
        sanitizePostgresText(message) ?? 'Scan failed',
        correlationId,
      );
      throw err;
    }
  }

  private async markFailed(
    documentId: string,
    message: string,
    correlationId?: string,
  ): Promise<void> {
    const row = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        scanStatus: DocumentScanStatus.FAILED,
        scanError: sanitizePostgresText(message) ?? 'Scan failed',
        scannedAt: new Date(),
      },
    });
    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.DOCUMENT_SCAN_COMPLETED,
      actorUserId: row.ownerUserId,
      entityType: 'document',
      entityId: documentId,
      correlationId,
      metadata: {
        failed: true,
        error: sanitizePostgresText(message) ?? 'Scan failed',
      },
    });
  }

  private validateUpload(file: UploadedMulterFile): void {
    if (!file?.buffer?.length) {
      throw new UnprocessableEntityException('File is required');
    }
    const maxBytes = getDocumentMaxBytes();
    if (file.size > maxBytes) {
      throw new UnprocessableEntityException(
        `File exceeds maximum size of ${maxBytes} bytes`,
      );
    }
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!getAllowedMimeTypes().has(mime)) {
      throw new UnprocessableEntityException(
        `File type not allowed: ${mime || 'unknown'}`,
      );
    }
    if (isExtensionBlocked(file.originalname ?? '')) {
      throw new UnprocessableEntityException('File extension is not allowed');
    }
  }

  private async assertComplaintExists(complaintId: string): Promise<void> {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
  }

  private async findDocumentOrThrow(id: string): Promise<Document> {
    const row = await this.prisma.document.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Document not found');
    }
    return row;
  }

  private toRecord(row: Document): DocumentRecord {
    return {
      id: row.id,
      complaintId: row.complaintId,
      ownerUserId: row.ownerUserId,
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      scanStatus: row.scanStatus,
      storageKey: row.storageKey,
      scannedAt: row.scannedAt ? row.scannedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
