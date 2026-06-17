import { complaintsToPdfBuffer } from './report-export-pdf.util';

describe('complaintsToPdfBuffer', () => {
  it('builds a non-empty PDF buffer', async () => {
    const pdf = await complaintsToPdfBuffer([
      {
        referenceNo: 'CMP-2026-0001',
        status: 'SUBMITTED',
        channel: 'WEB',
        priority: 'NORMAL',
        subject: 'PDF export branding smoke test',
        submittedAt: new Date('2026-06-01T10:00:00.000Z'),
        categoryId: null,
        orgUnitId: null,
      },
    ]);

    expect(pdf.length).toBeGreaterThan(100);
    expect(pdf.toString('utf-8', 0, 4)).toBe('%PDF');
  });
});
