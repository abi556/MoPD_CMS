import ExcelJS from 'exceljs';
import type { ComplaintExportRow } from './report-export-csv.util';

export async function complaintsToXlsxBuffer(
  rows: ComplaintExportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Complaints');
  sheet.columns = [
    { header: 'referenceNo', key: 'referenceNo', width: 18 },
    { header: 'status', key: 'status', width: 18 },
    { header: 'channel', key: 'channel', width: 12 },
    { header: 'priority', key: 'priority', width: 10 },
    { header: 'subject', key: 'subject', width: 40 },
    { header: 'submittedAt', key: 'submittedAt', width: 24 },
    { header: 'categoryId', key: 'categoryId', width: 36 },
    { header: 'orgUnitId', key: 'orgUnitId', width: 36 },
  ];
  for (const row of rows) {
    sheet.addRow({
      referenceNo: row.referenceNo,
      status: row.status,
      channel: row.channel,
      priority: row.priority,
      subject: row.subject,
      submittedAt: row.submittedAt.toISOString(),
      categoryId: row.categoryId ?? '',
      orgUnitId: row.orgUnitId ?? '',
    });
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
