import { ConflictException, NotFoundException } from '@nestjs/common';
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
              create: jest.fn(({ data }) => {
                const row = {
                  ...data,
                  scanError: data.scanError ?? null,
                  liveKey: data.liveKey ?? null,
                  scannedAt: data.scannedAt ?? null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as Document;
                documents.set(row.id, row);
                return Promise.resolve(row);
              }),
              findUnique: jest.fn(({ where: { id } }) =>
                Promise.resolve(documents.get(id) ?? null),
              ),
              update: jest.fn(({ where: { id }, data }) => {
                const existing = documents.get(id);
                if (!existing) {
                  throw new Error(`Document ${id} not found`);
                }
                const updated = {
                  ...existing,
                  ...data,
                  updatedAt: new Date(),
                } as Document;
                documents.set(id, updated);
                return Promise.resolve(updated);
              }),
              delete: jest.fn(({ where: { id } }) => {
                documents.delete(id);
                return Promise.resolve({ id });
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
    const file = {
      originalname: 'evidence.pdf',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from('%PDF'),
    } as Express.Multer.File;

    const record = await service.upload('cmp_1', 'user-officer-0001', file, 'c1');

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
    await memoryStorage.putObject(getLiveBucket(), liveKey, Buffer.from('%PDF'), {
      contentType: 'application/pdf',
    });

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
    const file = {
      originalname: 'evidence.pdf',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from('%PDF'),
    } as Express.Multer.File;
    await expect(
      service.upload('missing', 'user-officer-0001', file),
    ).rejects.toThrow(NotFoundException);
  });
});
