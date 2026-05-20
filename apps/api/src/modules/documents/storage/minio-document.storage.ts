import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import type {
  DocumentStorage,
  PutObjectMeta,
  SignedDownloadUrl,
} from '../interfaces/document-storage.interface';
import {
  getExportsBucket,
  getLiveBucket,
  getQuarantineBucket,
} from '../document.config';

function getMinioClient(): Minio.Client {
  const endPoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = Number.parseInt(process.env.MINIO_PORT ?? '9000', 10);
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const accessKey = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
  const secretKey = process.env.MINIO_SECRET_KEY ?? 'minioadmin';

  return new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });
}

@Injectable()
export class MinioDocumentStorage implements DocumentStorage {
  private readonly logger = new Logger(MinioDocumentStorage.name);
  private readonly client = getMinioClient();

  async ensureBuckets(): Promise<void> {
    for (const bucket of [
      getQuarantineBucket(),
      getLiveBucket(),
      getExportsBucket(),
    ]) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Created MinIO bucket: ${bucket}`);
      }
    }
  }

  async putObject(
    bucket: string,
    key: string,
    body: Buffer,
    meta: PutObjectMeta,
  ): Promise<void> {
    await this.client.putObject(bucket, key, body, body.length, {
      'Content-Type': meta.contentType,
      'X-Amz-Meta-Original-Name': meta.originalName ?? key,
    });
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    const stream = await this.client.getObject(bucket, key);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async copyObject(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
  ): Promise<void> {
    const conds = new Minio.CopyConditions();
    await this.client.copyObject(
      destBucket,
      destKey,
      `/${sourceBucket}/${sourceKey}`,
      conds,
    );
  }

  async removeObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  async getSignedDownloadUrl(
    bucket: string,
    key: string,
    ttlSec: number,
  ): Promise<SignedDownloadUrl> {
    const url = await this.client.presignedGetObject(bucket, key, ttlSec);
    return {
      url,
      expiresAt: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
  }
}
