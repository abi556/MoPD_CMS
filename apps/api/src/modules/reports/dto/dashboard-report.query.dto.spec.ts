import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReportExportDto } from './report-export.dto';

describe('CreateReportExportDto', () => {
  it('accepts export without optional UUID filters', async () => {
    const dto = plainToInstance(CreateReportExportDto, {
      from: '2026-01-01',
      to: '2026-12-31',
      bucket: 'day',
      format: 'csv',
      reportType: 'complaints',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts branded PDF export format', async () => {
    const dto = plainToInstance(CreateReportExportDto, {
      from: '2026-01-01',
      to: '2026-12-31',
      bucket: 'day',
      format: 'pdf',
      reportType: 'complaints',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('ignores Swagger placeholder string for categoryId', async () => {
    const dto = plainToInstance(CreateReportExportDto, {
      from: '2026-01-01',
      to: '2026-12-31',
      format: 'csv',
      reportType: 'complaints',
      categoryId: 'string',
      orgUnitId: 'string',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.categoryId).toBeUndefined();
    expect(dto.orgUnitId).toBeUndefined();
  });

  it('rejects invalid categoryId values', async () => {
    const dto = plainToInstance(CreateReportExportDto, {
      from: '2026-01-01',
      to: '2026-12-31',
      format: 'csv',
      reportType: 'complaints',
      categoryId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'categoryId')).toBe(true);
  });
});
