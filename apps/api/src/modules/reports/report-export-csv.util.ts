import { escapeCsvField } from '../audit/audit-csv.util';

const EXPORT_COLUMNS = [
  'referenceNo',
  'status',
  'channel',
  'priority',
  'subject',
  'submittedAt',
  'categoryId',
  'orgUnitId',
] as const;

export interface ComplaintExportRow {
  referenceNo: string;
  status: string;
  channel: string;
  priority: string;
  subject: string;
  submittedAt: Date;
  categoryId: string | null;
  orgUnitId: string | null;
}

export function complaintsToCsv(rows: ComplaintExportRow[]): string {
  const lines: string[] = [EXPORT_COLUMNS.join(',')];
  for (const row of rows) {
    const fields = [
      row.referenceNo,
      row.status,
      row.channel,
      row.priority,
      row.subject,
      row.submittedAt.toISOString(),
      row.categoryId ?? '',
      row.orgUnitId ?? '',
    ].map((field) => escapeCsvField(String(field)));
    lines.push(fields.join(','));
  }
  return `${lines.join('\n')}\n`;
}
