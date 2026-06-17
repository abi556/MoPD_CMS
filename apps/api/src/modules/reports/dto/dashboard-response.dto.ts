import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportMetaDto {
  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty({ enum: ['day', 'week', 'month'] })
  bucket!: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  orgUnitId?: string;
}

export class VolumeSeriesDto {
  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [Number] })
  counts!: number[];
}

export class VolumeDashboardDataDto {
  @ApiProperty({ type: [String] })
  buckets!: string[];

  @ApiProperty({ type: [VolumeSeriesDto] })
  series!: VolumeSeriesDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      submitted: { type: 'array', items: { type: 'number' } },
      closed: { type: 'array', items: { type: 'number' } },
    },
  })
  events!: { submitted: number[]; closed: number[] };

  @ApiProperty()
  meta!: ReportMetaDto & { total: number };
}

export class VolumeDashboardEnvelopeDto {
  @ApiProperty({ type: VolumeDashboardDataDto })
  data!: VolumeDashboardDataDto;
}

export class SlaDashboardDataDto {
  @ApiProperty()
  onTimePct!: number;

  @ApiProperty()
  breachedPct!: number;

  @ApiProperty()
  onTimeCount!: number;

  @ApiProperty()
  breachedCount!: number;

  @ApiProperty()
  activeCount!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  meta!: ReportMetaDto;
}

export class SlaDashboardEnvelopeDto {
  @ApiProperty({ type: SlaDashboardDataDto })
  data!: SlaDashboardDataDto;
}

export class ResolutionBucketDto {
  @ApiProperty()
  bucket!: string;

  @ApiProperty({ nullable: true })
  avgResolutionHours!: number | null;
}

export class ResolutionDashboardDataDto {
  @ApiProperty({ nullable: true })
  avgResolutionHours!: number | null;

  @ApiProperty()
  resolutionRate!: number;

  @ApiProperty()
  backlog!: number;

  @ApiProperty()
  closedCount!: number;

  @ApiProperty()
  createdCount!: number;

  @ApiProperty({ type: [ResolutionBucketDto] })
  byBucket!: ResolutionBucketDto[];

  @ApiProperty()
  meta!: ReportMetaDto;
}

export class ResolutionDashboardEnvelopeDto {
  @ApiProperty({ type: ResolutionDashboardDataDto })
  data!: ResolutionDashboardDataDto;
}

export class ChannelCountDto {
  @ApiProperty()
  channel!: string;

  @ApiProperty()
  count!: number;
}

export class ChannelsDashboardDataDto {
  @ApiProperty({ type: [ChannelCountDto] })
  channels!: ChannelCountDto[];

  @ApiProperty()
  meta!: ReportMetaDto & { total: number };
}

export class ChannelsDashboardEnvelopeDto {
  @ApiProperty({ type: ChannelsDashboardDataDto })
  data!: ChannelsDashboardDataDto;
}
