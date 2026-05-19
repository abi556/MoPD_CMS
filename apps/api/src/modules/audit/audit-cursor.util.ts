export interface AuditCursorPayload {
  createdAt: Date;
  id: string;
}

export class InvalidAuditCursorError extends Error {
  constructor(message = 'Invalid audit log cursor') {
    super(message);
    this.name = 'InvalidAuditCursorError';
  }
}

export function encodeAuditCursor(payload: AuditCursorPayload): string {
  const json = JSON.stringify({
    createdAt: payload.createdAt.toISOString(),
    id: payload.id,
  });
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeAuditCursor(cursor: string): AuditCursorPayload {
  let parsed: unknown;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new InvalidAuditCursorError();
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('id' in parsed) ||
    !('createdAt' in parsed) ||
    typeof (parsed as { id: unknown }).id !== 'string' ||
    typeof (parsed as { createdAt: unknown }).createdAt !== 'string'
  ) {
    throw new InvalidAuditCursorError();
  }

  const { id, createdAt } = parsed as { id: string; createdAt: string };
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    throw new InvalidAuditCursorError();
  }

  return { id, createdAt: date };
}
