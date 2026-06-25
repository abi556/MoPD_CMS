import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { DashboardReportQueryDto } from './dashboard-report.query.dto';

export class CreateReportExportDto extends DashboardReportQueryDto {
  @ApiProperty({ enum: ['csv', 'xlsx', 'pdf'] })
  @IsIn(['csv', 'xlsx', 'pdf'])
  format!: 'csv' | 'xlsx' | 'pdf';

  @ApiProperty({ enum: ['complaints', 'executive'], default: 'complaints' })
  @IsIn(['complaints', 'executive'])
  reportType!: 'complaints' | 'executive';
}

export class ReportExportCreatedDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED'],
  })
  status!: string;

  @ApiProperty()
  createdAt!: string;
}

export class ReportExportCreatedEnvelopeDto {
  @ApiProperty({ type: ReportExportCreatedDto })
  data!: ReportExportCreatedDto;
}

export class ReportExportDownloadDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiPropertyOptional()
  status?: string;
}

export class ReportExportDownloadEnvelopeDto {
  @ApiProperty({ type: ReportExportDownloadDto })
  data!: ReportExportDownloadDto;
}

export class ReportExportStatusEnvelopeDto {
  @ApiProperty()
  data!: {
    id: string;
    status: string;
    createdAt: string;
    completedAt?: string | null;
    errorMessage?: string | null;
  };
}
