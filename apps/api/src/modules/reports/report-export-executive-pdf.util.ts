import PDFDocument from 'pdfkit';
import type { ComplaintExportRow } from './report-export-csv.util';
import type {
  ChannelsDashboardResult,
  OfficerInsightsResult,
  ResolutionDashboardResult,
  SlaDashboardResult,
  VolumeDashboardResult,
} from './report-query.service';

const BRAND = {
  primary: '#2f6b3b',
  primaryDark: '#24582f',
  accent: '#4f46e5',
  warning: '#b45309',
  danger: '#b91c1c',
  slate: '#475569',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#c7dfcc',
  light: '#eaf4ec',
} as const;

export interface ExecutivePdfInput {
  rows: ComplaintExportRow[];
  volume: VolumeDashboardResult;
  sla: SlaDashboardResult;
  resolution: ResolutionDashboardResult;
  channels: ChannelsDashboardResult;
  officers: OfficerInsightsResult[];
  generatedAt: Date;
  redisStatus: 'ok' | 'degraded' | 'down';
  redisLatencyMs: number | null;
  exportQueuePending: number;
}

function pct(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 1000) / 10}%`;
}

function drawTitle(doc: PDFKit.PDFDocument, input: ExecutivePdfInput): number {
  doc
    .rect(40, 32, doc.page.width - 80, 80)
    .fill(BRAND.light)
    .stroke(BRAND.border);

  doc
    .fillColor(BRAND.primary)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('MoPD Executive Complaints Intelligence Report', 52, 50);

  doc
    .fillColor(BRAND.text)
    .font('Helvetica')
    .fontSize(10)
    .text(`Generated: ${input.generatedAt.toISOString()}`, 52, 76)
    .text('Audience: Leadership / Supervisory review', 52, 90);

  return 126;
}

function ensureRoom(
  doc: PDFKit.PDFDocument,
  y: number,
  minHeight: number,
): number {
  if (y + minHeight <= doc.page.height - 40) {
    return y;
  }
  doc.addPage();
  return 40;
}

function sectionHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
): number {
  doc
    .fillColor(BRAND.primary)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(title, 40, y);
  return y + 18;
}

function metricRow(
  doc: PDFKit.PDFDocument,
  y: number,
  label: string,
  value: string,
): number {
  doc
    .fillColor(BRAND.text)
    .font('Helvetica')
    .fontSize(10)
    .text(label, 44, y, { width: 320 })
    .font('Helvetica-Bold')
    .text(value, 380, y, { width: 170, align: 'right' });
  return y + 14;
}

function barChart(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
  items: Array<{ label: string; value: number }>,
): number {
  let current = sectionHeader(doc, y, title);
  const max = Math.max(...items.map((i) => i.value), 1);

  for (const item of items) {
    const rowY = current;
    const width = Math.round((item.value / max) * 260);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica')
      .fontSize(9)
      .text(item.label, 44, rowY + 3, { width: 170 });

    doc.rect(220, rowY, 260, 12).fill('#f3f4f6').stroke(BRAND.border);
    doc.rect(220, rowY, width, 12).fill(BRAND.primary);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica-Bold')
      .text(String(item.value), 490, rowY + 2, { width: 60, align: 'right' });
    current += 18;
  }

  return current + 4;
}

function donutChart(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
  items: Array<{ label: string; value: number; color: string }>,
): number {
  const current = sectionHeader(doc, y, title);
  const total = Math.max(
    items.reduce((sum, item) => sum + item.value, 0),
    1,
  );
  const cx = 122;
  const cy = current + 56;
  const radius = 42;
  const innerRadius = 23;

  let start = -Math.PI / 2;
  for (const item of items) {
    const angle = (item.value / total) * Math.PI * 2;
    const end = start + angle;
    const steps = Math.max(
      6,
      Math.ceil((Math.abs(angle) * 180) / (Math.PI * 12)),
    );
    doc.save().fillColor(item.color).moveTo(cx, cy);
    for (let step = 0; step <= steps; step += 1) {
      const t = start + (step / steps) * angle;
      const x = cx + Math.cos(t) * radius;
      const yPoint = cy + Math.sin(t) * radius;
      doc.lineTo(x, yPoint);
    }
    doc.lineTo(cx, cy).fill().restore();
    start = end;
  }

  doc.circle(cx, cy, innerRadius).fill('#ffffff').stroke(BRAND.border);
  doc
    .fillColor(BRAND.text)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(String(total), cx - 16, cy - 6, { width: 32, align: 'center' });

  let legendY = current + 8;
  for (const item of items) {
    const share = pct(item.value, total);
    doc
      .rect(210, legendY + 2, 10, 10)
      .fill(item.color)
      .stroke(item.color);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica')
      .fontSize(9)
      .text(`${item.label} (${share})`, 225, legendY, { width: 260 });
    legendY += 16;
  }

  return current + 122;
}

function lineChart(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
  labels: string[],
  lines: Array<{ label: string; values: number[]; color: string }>,
): number {
  const current = sectionHeader(doc, y, title);
  const chartX = 44;
  const chartY = current + 8;
  const chartW = 500;
  const chartH = 92;
  const n = Math.max(labels.length, 2);

  const max = Math.max(1, ...lines.flatMap((line) => line.values));

  doc.rect(chartX, chartY, chartW, chartH).fill('#ffffff').stroke(BRAND.border);

  for (let i = 1; i <= 3; i += 1) {
    const gy = chartY + Math.round((chartH * i) / 4);
    doc
      .moveTo(chartX, gy)
      .lineTo(chartX + chartW, gy)
      .lineWidth(0.6)
      .strokeColor('#e5e7eb')
      .stroke();
  }

  for (const line of lines) {
    doc.save();
    doc.lineWidth(1.8).strokeColor(line.color);
    line.values.forEach((value, idx) => {
      const x = chartX + Math.round((idx / (n - 1)) * chartW);
      const yPoint = chartY + chartH - Math.round((value / max) * (chartH - 6));
      if (idx === 0) {
        doc.moveTo(x, yPoint);
      } else {
        doc.lineTo(x, yPoint);
      }
    });
    doc.stroke();
    doc.restore();
  }

  const ticks = [0, Math.floor(labels.length / 2), labels.length - 1].filter(
    (idx, pos, arr) => idx >= 0 && arr.indexOf(idx) === pos,
  );
  for (const idx of ticks) {
    const x = chartX + Math.round((idx / (n - 1)) * chartW);
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(labels[idx] ?? '', x - 22, chartY + chartH + 4, {
        width: 44,
        align: 'center',
      });
  }

  let legendX = chartX;
  const legendY = chartY + chartH + 18;
  for (const line of lines) {
    doc
      .rect(legendX, legendY + 2, 10, 10)
      .fill(line.color)
      .stroke(line.color);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica')
      .fontSize(9)
      .text(line.label, legendX + 14, legendY, { width: 120 });
    legendX += 128;
  }

  return legendY + 18;
}

export function executiveToPdfBuffer(
  input: ExecutivePdfInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = drawTitle(doc, input);

    // Executive narrative
    y = ensureRoom(doc, y, 86);
    y = sectionHeader(doc, y, 'Executive summary');
    const total = input.volume.meta.total;
    const submitted = input.volume.events.submitted.reduce((a, b) => a + b, 0);
    const closed = input.volume.events.closed.reduce((a, b) => a + b, 0);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica')
      .fontSize(10)
      .text(
        `Across the selected period, ${total} complaints were observed. Intake reached ${submitted} and closure events reached ${closed}. Resolution rate is ${input.resolution.resolutionRate}% with backlog at ${input.resolution.backlog}. SLA breached share is ${input.sla.breachedPct}% (${input.sla.breachedCount}/${input.sla.total}).`,
        44,
        y,
        { width: doc.page.width - 88, lineGap: 2 },
      );
    y = doc.y + 6;

    // KPI block
    y = ensureRoom(doc, y, 140);
    y = sectionHeader(doc, y, 'Key performance indicators');
    y = metricRow(doc, y, 'Complaints in period', String(total));
    y = metricRow(
      doc,
      y,
      'Closure rate',
      `${input.resolution.resolutionRate}% (${input.resolution.closedCount}/${input.resolution.createdCount})`,
    );
    y = metricRow(doc, y, 'Backlog', String(input.resolution.backlog));
    y = metricRow(
      doc,
      y,
      'SLA on-time vs breached',
      `${input.sla.onTimePct}% / ${input.sla.breachedPct}%`,
    );
    y = metricRow(
      doc,
      y,
      'Average resolution time',
      input.resolution.avgResolutionHours === null
        ? 'N/A'
        : `${input.resolution.avgResolutionHours.toFixed(2)} h`,
    );
    y += 8;

    // Intake trend chart
    y = ensureRoom(doc, y, 170);
    y = lineChart(doc, y, 'Intake vs closure trend', input.volume.buckets, [
      {
        label: 'Submitted',
        values: input.volume.events.submitted,
        color: BRAND.primary,
      },
      {
        label: 'Closed',
        values: input.volume.events.closed,
        color: BRAND.accent,
      },
    ]);
    y += 8;

    // Donut infographics (channels and SLA)
    y = ensureRoom(doc, y, 168);
    y = donutChart(
      doc,
      y,
      'Channel distribution (pie infographic)',
      input.channels.channels.map((c, idx) => ({
        label: c.channel,
        value: c.count,
        color: [
          BRAND.primary,
          BRAND.accent,
          BRAND.warning,
          BRAND.slate,
          BRAND.danger,
        ][idx % 5],
      })),
    );
    y += 4;
    y = donutChart(doc, y, 'SLA quality split', [
      {
        label: 'On-time',
        value: input.sla.onTimeCount,
        color: BRAND.primary,
      },
      {
        label: 'Breached',
        value: input.sla.breachedCount,
        color: BRAND.danger,
      },
      {
        label: 'Active',
        value: input.sla.activeCount,
        color: BRAND.warning,
      },
    ]);

    // Officer workload
    y = ensureRoom(doc, y, 160);
    y = sectionHeader(doc, y, 'Officer workload and closure effectiveness');
    if (input.officers.length === 0) {
      doc
        .fillColor(BRAND.muted)
        .font('Helvetica')
        .fontSize(10)
        .text('No assigned officer data found for the selected window.', 44, y);
      y += 18;
    } else {
      for (const officer of input.officers.slice(0, 8)) {
        y = barChart(doc, y, `Officer: ${officer.assigneeEmail}`, [
          { label: 'Assigned', value: officer.totalAssigned },
          { label: 'Closed', value: officer.closedAssigned },
        ]);
      }
    }
    y += 6;

    // System health
    y = ensureRoom(doc, y, 110);
    y = sectionHeader(doc, y, 'System health snapshot');
    y = metricRow(doc, y, 'Redis status', input.redisStatus.toUpperCase());
    y = metricRow(
      doc,
      y,
      'Redis latency',
      input.redisLatencyMs === null ? 'N/A' : `${input.redisLatencyMs} ms`,
    );
    y = metricRow(
      doc,
      y,
      'Pending export jobs',
      String(input.exportQueuePending),
    );
    y = metricRow(doc, y, 'Data rows sampled', String(input.rows.length));

    // Recommendations
    y = ensureRoom(doc, y, 150);
    y = sectionHeader(doc, y + 8, 'Automated recommendations');
    const recommendations: string[] = [];
    if (input.sla.breachedPct >= 15) {
      recommendations.push(
        `SLA breach level is ${input.sla.breachedPct}%. Escalate staffing in high-load queues and review category-level SLA targets.`,
      );
    }
    if (input.resolution.backlog > Math.max(20, Math.round(total * 0.25))) {
      recommendations.push(
        `Backlog is elevated at ${input.resolution.backlog}. Prioritize aged cases and enforce closure QA checkpoints.`,
      );
    }
    if (input.channels.meta.total > 0) {
      const topChannel = [...input.channels.channels].sort(
        (a, b) => b.count - a.count,
      )[0];
      recommendations.push(
        `Top intake channel is ${topChannel.channel} (${pct(topChannel.count, input.channels.meta.total)}). Allocate triage capacity around this channel first.`,
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        'No critical risk signals detected. Continue monitoring SLA and backlog trends weekly.',
      );
    }
    doc
      .fillColor(BRAND.text)
      .font('Helvetica')
      .fontSize(10)
      .list(recommendations, 50, y, {
        width: doc.page.width - 100,
        bulletRadius: 1.5,
      });

    doc.end();
  });
}
