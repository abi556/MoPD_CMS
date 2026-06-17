import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ComplaintExportRow } from './report-export-csv.util';

const BRAND = {
  primary: '#2f6b3b',
  primaryLight: '#eaf4ec',
  border: '#c7dfcc',
  text: '#1f2937',
  muted: '#6b7280',
  watermark: '#d2e6d6',
};

const TABLE_COLUMNS = [
  { key: 'reference', label: 'Reference', x: 40, width: 85 },
  { key: 'status', label: 'Status', x: 125, width: 70 },
  { key: 'channel', label: 'Channel', x: 195, width: 52 },
  { key: 'priority', label: 'Priority', x: 247, width: 58 },
  { key: 'subject', label: 'Subject', x: 305, width: 150 },
  { key: 'submitted', label: 'Submitted', x: 455, width: 100 },
] as const;

function truncateToWidth(
  doc: PDFKit.PDFDocument,
  value: string,
  width: number,
): string {
  if (doc.widthOfString(value) <= width) {
    return value;
  }
  const ellipsis = '...';
  const target = Math.max(0, width - doc.widthOfString(ellipsis));
  let clipped = value;
  while (clipped.length > 0 && doc.widthOfString(clipped) > target) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}${ellipsis}`;
}

function drawCell(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  isHeader = false,
): void {
  doc
    .rect(x, y, width, height)
    .fill(isHeader ? BRAND.primary : '#ffffff')
    .stroke(isHeader ? BRAND.primary : BRAND.border);
  doc
    .fillColor(isHeader ? '#ffffff' : BRAND.text)
    .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(isHeader ? 9 : 8)
    .text(
      truncateToWidth(doc, text, width - 10),
      x + 5,
      y + (isHeader ? 8 : 5),
      {
        width: width - 10,
        lineBreak: false,
      },
    );
}

function formatDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(value)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function drawHeader(doc: PDFKit.PDFDocument, generatedAt: string): void {
  doc
    .rect(40, 32, doc.page.width - 80, 64)
    .fill(BRAND.primaryLight)
    .stroke(BRAND.primary);
  const logoPath = join(process.cwd(), 'assets', 'mopd-logo.png');
  if (existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { fit: [38, 38] });
  } else {
    doc
      .rect(50, 45, 38, 38)
      .fill(BRAND.primary)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('MoPD', 56, 59);
  }

  doc
    .fillColor(BRAND.primary)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('Ministry of Public Development (MoPD)', 96, 46);
  doc
    .fillColor(BRAND.text)
    .font('Helvetica')
    .fontSize(11)
    .text('Complaints Report Export', 96, 67)
    .text(`Generated: ${generatedAt}`, 96, 81);
}

function drawWatermark(doc: PDFKit.PDFDocument): void {
  const previousOpacity = 1;
  doc.save();
  doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc
    .fillColor(BRAND.watermark)
    .opacity(0.18)
    .font('Helvetica-Bold')
    .fontSize(56)
    .text('MoPD Confidential', 120, doc.page.height / 2 - 10, {
      align: 'center',
      width: doc.page.width - 240,
    });
  doc.opacity(previousOpacity);
  doc.restore();
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  for (const column of TABLE_COLUMNS) {
    drawCell(doc, column.label, column.x, y, column.width, 24, true);
  }
  return y + 24;
}

function rowValues(row: ComplaintExportRow): string[] {
  return [
    row.referenceNo,
    row.status,
    row.channel,
    row.priority,
    row.subject,
    formatDate(row.submittedAt),
  ];
}

export function complaintsToPdfBuffer(
  rows: ComplaintExportRow[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const generatedAt = formatDate(new Date());
    drawHeader(doc, generatedAt);
    drawWatermark(doc);

    let y = drawTableHeader(doc, 118);
    doc.font('Helvetica').fontSize(8).fillColor(BRAND.text);

    for (const row of rows) {
      if (y > doc.page.height - 52) {
        doc.addPage();
        drawWatermark(doc);
        y = drawTableHeader(doc, 40);
        doc.font('Helvetica').fontSize(8).fillColor(BRAND.text);
      }

      const values = rowValues(row);
      const rowHeight = 20;
      for (let index = 0; index < TABLE_COLUMNS.length; index += 1) {
        const column = TABLE_COLUMNS[index];
        drawCell(doc, values[index], column.x, y, column.width, rowHeight);
      }
      y += rowHeight;
    }

    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(`Total rows: ${rows.length}`, 40, doc.page.height - 28, {
        align: 'left',
      });

    doc.end();
  });
}
