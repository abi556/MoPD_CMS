import { Injectable } from '@nestjs/common';
import type {
  DocumentStorage,
  PutObjectMeta,
  SignedDownloadUrl,
} from '../interfaces/document-storage.interface';
import { getLiveBucket, getQuarantineBucket } from '../document.config';

function objectKey(bucket: string, key: string): string {
  return `${bucket}::${key}`;
}

@Injectable()
export class MemoryDocumentStorage implements DocumentStorage {
  private readonly store = new Map<string, Buffer>();

  async ensureBuckets(): Promise<void> {
    // no-op for in-memory storage
  }

  async putObject(
    bucket: string,
    key: string,
    body: Buffer,
    _meta: PutObjectMeta,
  ): Promise<void> {
    this.store.set(objectKey(bucket, key), Buffer.from(body));
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    const found = this.store.get(objectKey(bucket, key));
    if (!found) {
      throw new Error(`Object not found: ${bucket}/${key}`);
    }
    return Buffer.from(found);
  }

  async copyObject(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
  ): Promise<void> {
    const body = await this.getObject(sourceBucket, sourceKey);
    await this.putObject(destBucket, destKey, body, {
      contentType: 'application/octet-stream',
    });
  }

  async removeObject(bucket: string, key: string): Promise<void> {
    this.store.delete(objectKey(bucket, key));
  }

  async getSignedDownloadUrl(
    bucket: string,
    key: string,
    ttlSec: number,
  ): Promise<SignedDownloadUrl> {
    if (!this.store.has(objectKey(bucket, key))) {
      throw new Error(`Object not found: ${bucket}/${key}`);
    }
    const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();
    return {
      url: `memory://${bucket}/${key}?expires=${encodeURIComponent(expiresAt)}`,
      expiresAt,
    };
  }

  /** Test helper: seed buckets exist conceptually */
  getDefaultBuckets(): { quarantine: string; live: string } {
    return {
      quarantine: getQuarantineBucket(),
      live: getLiveBucket(),
    };
  }
}
