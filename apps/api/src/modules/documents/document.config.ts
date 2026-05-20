const DEFAULT_ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'audio/mpeg',
] as const;

const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.js',
  '.jar',
  '.vbs',
  '.ps1',
  '.dll',
  '.scr',
  '.com',
]);

export function getQuarantineBucket(): string {
  return process.env.MINIO_BUCKET_QUARANTINE ?? 'mopd-quarantine';
}

export function getLiveBucket(): string {
  return process.env.MINIO_BUCKET_LIVE ?? 'mopd-live';
}

export function getExportsBucket(): string {
  return process.env.MINIO_BUCKET_EXPORTS ?? 'mopd-exports';
}

export function getReportExportMaxRows(): number {
  const raw = process.env.REPORT_EXPORT_MAX_ROWS;
  if (!raw) {
    return 50_000;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 50_000 : parsed;
}

export function getReportExportTtlSec(): number {
  const raw = process.env.REPORT_EXPORT_TTL_SEC;
  if (!raw) {
    return 86_400;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 86_400 : parsed;
}

export function getDocumentMaxBytes(): number {
  const raw = process.env.DOCUMENT_MAX_BYTES;
  if (!raw) {
    return 25 * 1024 * 1024;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 25 * 1024 * 1024 : parsed;
}

export function getPresignTtlSec(): number {
  const raw = process.env.MINIO_PRESIGN_TTL_SEC;
  if (!raw) {
    return 900;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 900 : parsed;
}

export function getAllowedMimeTypes(): Set<string> {
  const raw = process.env.DOCUMENT_ALLOWED_MIME;
  if (!raw?.trim()) {
    return new Set(DEFAULT_ALLOWED_MIME);
  }
  return new Set(
    raw
      .split(',')
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isExtensionBlocked(filename: string): boolean {
  const lower = filename.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) {
    return false;
  }
  return BLOCKED_EXTENSIONS.has(lower.slice(dot));
}

export function buildStorageKey(
  complaintId: string,
  documentId: string,
): string {
  return `complaints/${complaintId}/${documentId}`;
}

/** PostgreSQL text/JSON must not contain NUL (0x00) bytes. */
export function sanitizePostgresText(value: string): string;
export function sanitizePostgresText(value: null | undefined): null;
export function sanitizePostgresText(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  return value.replace(/\0/g, '');
}
