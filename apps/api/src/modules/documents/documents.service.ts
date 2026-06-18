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
import { ComplaintAccessService } from '../complaints/complaint-access.service';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
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
    private readonly complaintAccessService: ComplaintAccessService,
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
    actor?: JwtUser,
  ): Promise<DocumentRecord> {
    const normalizedFile = this.normalizeUpload(file);
    await this.assertComplaintAccess(complaintId, actor);
    this.validateUpload(normalizedFile);

    const storage = this.storageFactory.getStorage();
    const quarantineBucket = getQuarantineBucket();
    const documentId = randomUUID();
    const storageKey = buildStorageKey(complaintId, documentId);
    const quarantineKey = `${storageKey}/quarantine`;

    await storage.putObject(
      quarantineBucket,
      quarantineKey,
      normalizedFile.buffer,
      {
        contentType: normalizedFile.mimetype,
        originalName: normalizedFile.originalname,
      },
    );

    const row = await this.prisma.document.create({
      data: {
        id: documentId,
        complaintId,
        ownerUserId,
        originalName: normalizedFile.originalname,
        mimeType: normalizedFile.mimetype,
        sizeBytes: normalizedFile.size,
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
        originalName: normalizedFile.originalname,
        mimeType: normalizedFile.mimetype,
        sizeBytes: normalizedFile.size,
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

  async getMetadata(id: string, actor?: JwtUser): Promise<DocumentRecord> {
    const row = await this.findDocumentOrThrow(id);
    await this.assertComplaintAccess(row.complaintId, actor);
    return this.toRecord(row);
  }

  async getDownloadUrl(
    id: string,
    actorUserId: string,
    correlationId?: string,
    actor?: JwtUser,
  ): Promise<{ url: string; expiresAt: string }> {
    const row = await this.findDocumentOrThrow(id);
    await this.assertComplaintAccess(row.complaintId, actor);

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
    actor?: JwtUser,
  ): Promise<void> {
    const row = await this.findDocumentOrThrow(id);
    await this.assertComplaintAccess(row.complaintId, actor);
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
    if (!this.matchesMagicSignature(file.buffer, mime)) {
      throw new UnprocessableEntityException(
        'File content signature does not match declared type',
      );
    }
  }

  private normalizeUpload(file: UploadedMulterFile): UploadedMulterFile {
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (mime === 'image/jpeg') {
      const stripped = this.stripJpegMetadata(file.buffer);
      return { ...file, buffer: stripped, size: stripped.length };
    }
    if (mime === 'image/png') {
      const stripped = this.stripPngMetadata(file.buffer);
      return { ...file, buffer: stripped, size: stripped.length };
    }
    return file;
  }

  private matchesMagicSignature(buffer: Buffer, mime: string): boolean {
    if (buffer.length < 4) {
      return false;
    }
    const startsWith = (...bytes: number[]) =>
      bytes.every((byte, i) => buffer[i] === byte);

    switch (mime) {
      case 'application/pdf':
        return startsWith(0x25, 0x50, 0x44, 0x46); // %PDF
      case 'image/jpeg':
        return startsWith(0xff, 0xd8, 0xff);
      case 'image/png':
        return startsWith(0x89, 0x50, 0x4e, 0x47);
      case 'image/gif':
        return (
          startsWith(0x47, 0x49, 0x46, 0x38, 0x37, 0x61) ||
          startsWith(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)
        );
      case 'video/mp4':
        return (
          buffer.length >= 12 && buffer.subarray(4, 8).toString() === 'ftyp'
        );
      case 'audio/mpeg':
        return (
          startsWith(0x49, 0x44, 0x33) || // ID3 tag
          (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
        );
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return startsWith(0x50, 0x4b, 0x03, 0x04); // ZIP container
      case 'application/msword':
      case 'application/vnd.ms-excel':
        return startsWith(0xd0, 0xcf, 0x11, 0xe0); // OLE CF
      default:
        // If allowed MIME is extended, keep backward compatibility and avoid false rejects.
        return true;
    }
  }

  private stripJpegMetadata(input: Buffer): Buffer {
    if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) {
      return input;
    }
    const chunks: Buffer[] = [input.subarray(0, 2)];
    let offset = 2;
    while (offset + 4 <= input.length) {
      if (input[offset] !== 0xff) {
        break;
      }
      const marker = input[offset + 1];
      // Start of scan -> copy rest as-is (compressed image stream).
      if (marker === 0xda) {
        chunks.push(input.subarray(offset));
        return Buffer.concat(chunks);
      }
      // Standalone markers without payload.
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        chunks.push(input.subarray(offset, offset + 2));
        offset += 2;
        continue;
      }
      const length = input.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > input.length) {
        return input;
      }
      const segmentEnd = offset + 2 + length;
      const isMetadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
      if (!isMetadata) {
        chunks.push(input.subarray(offset, segmentEnd));
      }
      offset = segmentEnd;
    }
    return Buffer.concat(chunks);
  }

  private stripPngMetadata(input: Buffer): Buffer {
    const pngSig = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    if (input.length < 8 || !input.subarray(0, 8).equals(pngSig)) {
      return input;
    }
    const chunks: Buffer[] = [input.subarray(0, 8)];
    let offset = 8;
    while (offset + 12 <= input.length) {
      const length = input.readUInt32BE(offset);
      const chunkTypeStart = offset + 4;
      const chunkDataStart = offset + 8;
      const chunkEnd = chunkDataStart + length + 4; // +crc
      if (chunkEnd > input.length) {
        return input;
      }
      const chunkType = input.subarray(chunkTypeStart, chunkTypeStart + 4);
      const isCritical = chunkType.every(
        (char) => char >= 65 && char <= 90, // A-Z
      );
      if (isCritical) {
        chunks.push(input.subarray(offset, chunkEnd));
      }
      offset = chunkEnd;
      if (chunkType.toString() === 'IEND') {
        break;
      }
    }
    return Buffer.concat(chunks);
  }

  async listByComplaint(complaintId: string): Promise<DocumentRecord[]> {
    const rows = await this.prisma.document.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  private async assertComplaintAccess(
    complaintId: string,
    actor?: JwtUser,
  ): Promise<void> {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, assignedToUserId: true, status: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    if (actor) {
      this.complaintAccessService.assertCanAccessComplaint(actor, complaint);
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
