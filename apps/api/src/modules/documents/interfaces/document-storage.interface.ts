export interface PutObjectMeta {
  contentType: string;
  originalName?: string;
}

export interface SignedDownloadUrl {
  url: string;
  expiresAt: string;
}

export interface DocumentStorage {
  ensureBuckets(): Promise<void>;
  putObject(
    bucket: string,
    key: string,
    body: Buffer,
    meta: PutObjectMeta,
  ): Promise<void>;
  getObject(bucket: string, key: string): Promise<Buffer>;
  copyObject(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
  ): Promise<void>;
  removeObject(bucket: string, key: string): Promise<void>;
  getSignedDownloadUrl(
    bucket: string,
    key: string,
    ttlSec: number,
  ): Promise<SignedDownloadUrl>;
}
