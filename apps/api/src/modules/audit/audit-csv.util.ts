const CSV_COLUMNS = [
  'id',
  'eventType',
  'actorUserId',
  'entityType',
  'entityId',
  'correlationId',
  'metadata',
  'createdAt',
] as const;

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface AuditLogCsvRow {
  id: string;
  eventType: string;
  actorUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  correlationId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export function auditLogsToCsv(rows: AuditLogCsvRow[]): string {
  const lines: string[] = [CSV_COLUMNS.join(',')];
  for (const row of rows) {
    const metadata =
      row.metadata === null || row.metadata === undefined
        ? ''
        : JSON.stringify(row.metadata);
    const fields = [
      row.id,
      row.eventType,
      row.actorUserId ?? '',
      row.entityType ?? '',
      row.entityId ?? '',
      row.correlationId ?? '',
      metadata,
      row.createdAt.toISOString(),
    ].map((field) => escapeCsvField(field));
    lines.push(fields.join(','));
  }
  return `${lines.join('\n')}\n`;
}
