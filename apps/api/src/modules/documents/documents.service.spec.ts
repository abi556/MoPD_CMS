import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DocumentScanStatus, type Document } from '@prisma/client';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_DOCUMENT_SCAN } from '../../queue/queue.constants';
import { getLiveBucket } from './document.config';
import { DocumentsService } from './documents.service';
import { DocumentStorageFactory } from './storage/document-storage.factory';
import { MemoryDocumentStorage } from './storage/memory-document.storage';
import { VirusScannerFactory } from './scanners/virus-scanner.factory';
import { NoOpVirusScanner } from './scanners/noop-virus.scanner';
import type { UploadedMulterFile } from './types/uploaded-file';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const memoryStorage = new MemoryDocumentStorage();
  const noopScanner = new NoOpVirusScanner();
  const documents = new Map<string, Document>();
  const complaintFindUnique = jest.fn();
  const logEvent = jest.fn();
  const queueAdd = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    documents.clear();
    process.env.NODE_ENV = 'test';

    complaintFindUnique.mockResolvedValue({ id: 'cmp_1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: PrismaService,
          useValue: {
            complaint: { findUnique: complaintFindUnique },
            document: {
              create: jest.fn(
                ({
                  data,
                }: {
                  data: Omit<Document, 'createdAt' | 'updatedAt'>;
                }) => {
                  const row: Document = {
                    ...data,
                    scanError: data.scanError ?? null,
                    liveKey: data.liveKey ?? null,
                    scannedAt: data.scannedAt ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  documents.set(row.id, row);
                  return Promise.resolve(row);
                },
              ),
              findUnique: jest.fn(({ where }: { where: { id: string } }) =>
                Promise.resolve(documents.get(where.id) ?? null),
              ),
              update: jest.fn(
                ({
                  where,
                  data,
                }: {
                  where: { id: string };
                  data: Partial<Document>;
                }) => {
                  const existing = documents.get(where.id);
                  if (!existing) {
                    throw new Error(`Document ${where.id} not found`);
                  }
                  const updated: Document = {
                    ...existing,
                    ...data,
                    updatedAt: new Date(),
                  };
                  documents.set(updated.id, updated);
                  return Promise.resolve(updated);
                },
              ),
              delete: jest.fn(({ where }: { where: { id: string } }) => {
                documents.delete(where.id);
                return Promise.resolve({ id: where.id });
              }),
            },
          },
        },
        { provide: AuditService, useValue: { logEvent } },
        {
          provide: DocumentStorageFactory,
          useValue: { getStorage: () => memoryStorage },
        },
        {
          provide: VirusScannerFactory,
          useValue: { getScanner: () => noopScanner },
        },
        {
          provide: getQueueToken(QUEUE_DOCUMENT_SCAN),
          useValue: { add: queueAdd },
        },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  it('uploads to quarantine and scans synchronously in test', async () => {
    const file: UploadedMulterFile = {
      fieldname: 'file',
      originalname: 'evidence.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from('%PDF'),
    };

    const record = await service.upload(
      'cmp_1',
      'user-officer-0001',
      file,
      'c1',
    );

    expect(record.scanStatus).toBe(DocumentScanStatus.CLEAN);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AUDIT_EVENT.DOCUMENT_UPLOADED }),
    );
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it('rejects download for infected document', async () => {
    documents.set('doc_infected', {
      id: 'doc_infected',
      complaintId: 'cmp_1',
      ownerUserId: 'user-officer-0001',
      originalName: 'virus.txt',
      mimeType: 'application/pdf',
      sizeBytes: 68,
      scanStatus: DocumentScanStatus.INFECTED,
      storageKey: 'complaints/cmp_1/doc_infected',
      quarantineKey: null,
      liveKey: null,
      scanError: 'Eicar-Test-Signature',
      scannedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.getDownloadUrl('doc_infected', 'user-officer-0001'),
    ).rejects.toThrow(ConflictException);
  });

  it('returns presigned url for clean document', async () => {
    const liveKey = 'complaints/cmp_1/doc_clean';
    documents.set('doc_clean', {
      id: 'doc_clean',
      complaintId: 'cmp_1',
      ownerUserId: 'user-officer-0001',
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      scanStatus: DocumentScanStatus.CLEAN,
      storageKey: liveKey,
      quarantineKey: null,
      liveKey,
      scanError: null,
      scannedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await memoryStorage.putObject(
      getLiveBucket(),
      liveKey,
      Buffer.from('%PDF'),
      {
        contentType: 'application/pdf',
      },
    );

    const result = await service.getDownloadUrl(
      'doc_clean',
      'user-officer-0001',
    );
    expect(result.url).toContain('memory://');
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AUDIT_EVENT.DOCUMENT_DOWNLOAD_REQUESTED,
      }),
    );
  });

  it('throws when complaint missing', async () => {
    complaintFindUnique.mockResolvedValueOnce(null);
    const file: UploadedMulterFile = {
      fieldname: 'file',
      originalname: 'evidence.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from('%PDF'),
    };
    await expect(
      service.upload('missing', 'user-officer-0001', file),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects payload when magic bytes do not match declared mime', async () => {
    const file: UploadedMulterFile = {
      fieldname: 'file',
      originalname: 'not-a-pdf.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 6,
      buffer: Buffer.from('GIF89a', 'utf8'),
    };

    await expect(
      service.upload('cmp_1', 'user-officer-0001', file),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('strips jpeg metadata before persisting', async () => {
    const jpegWithApp1 = Buffer.from([
      0xff,
      0xd8, // SOI
      0xff,
      0xe1,
      0x00,
      0x06,
      0x45,
      0x78,
      0x69,
      0x66, // APP1 metadata payload ("Exif")
      0xff,
      0xdb,
      0x00,
      0x04,
      0x00,
      0x00, // DQT
      0xff,
      0xda,
      0x00,
      0x04,
      0x00,
      0x00, // SOS
      0x11,
      0x22,
      0xff,
      0xd9, // compressed data + EOI
    ]);
    const file: UploadedMulterFile = {
      fieldname: 'file',
      originalname: 'photo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: jpegWithApp1.length,
      buffer: jpegWithApp1,
    };

    const record = await service.upload('cmp_1', 'user-officer-0001', file);

    expect(record.sizeBytes).toBeLessThan(jpegWithApp1.length);
  });
});
