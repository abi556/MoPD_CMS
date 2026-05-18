import { Injectable } from '@nestjs/common';
import type { DocumentStorage } from '../interfaces/document-storage.interface';
import { MemoryDocumentStorage } from './memory-document.storage';
import { MinioDocumentStorage } from './minio-document.storage';

export type DocumentStorageDriver = 'memory' | 'minio';

@Injectable()
export class DocumentStorageFactory {
  constructor(
    private readonly memoryStorage: MemoryDocumentStorage,
    private readonly minioStorage: MinioDocumentStorage,
  ) {}

  getStorage(): DocumentStorage {
    const driver = this.resolveDriver();
    switch (driver) {
      case 'minio':
        return this.minioStorage;
      case 'memory':
      default:
        return this.memoryStorage;
    }
  }

  private resolveDriver(): DocumentStorageDriver {
    const explicit = process.env.DOCUMENT_STORAGE_DRIVER?.toLowerCase();
    if (explicit === 'minio' || explicit === 'memory') {
      return explicit;
    }
    if (
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.JEST_WORKER_ID)
    ) {
      return 'memory';
    }
    return 'minio';
  }
}
