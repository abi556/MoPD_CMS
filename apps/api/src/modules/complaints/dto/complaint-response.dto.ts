import { ApiProperty } from '@nestjs/swagger';
import { ComplaintChannel, ComplaintLocale } from './create-complaint.dto';

export class ComplaintCreatedDataDto {
  @ApiProperty({
    example: 'a3f8ad3f-967c-4b15-a18d-724bf6ca9a08',
    description: 'Internal complaint id.',
  })
  id!: string;

  @ApiProperty({
    example: 'CMS-2026-000001',
    description: 'Public reference used for tracking.',
  })
  referenceNo!: string;

  @ApiProperty({
    example: 'SUBMITTED',
    description: 'Current complaint status.',
  })
  status!: 'SUBMITTED';

  @ApiProperty({
    enum: ComplaintChannel,
    example: ComplaintChannel.WEB,
    description: 'Submission channel.',
  })
  channel!: ComplaintChannel;

  @ApiProperty({
    example: 'Road project delay in zone 3',
    description: 'Complaint subject.',
  })
  subject!: string;

  @ApiProperty({
    example: '2026-04-28T18:58:00.000Z',
    description: 'ISO-8601 submission timestamp.',
  })
  submittedAt!: string;

  @ApiProperty({
    enum: ComplaintLocale,
    example: ComplaintLocale.EN,
    description: 'Preferred language.',
  })
  locale!: ComplaintLocale;

  @ApiProperty({
    example: true,
    description: 'Consent acknowledgement flag.',
  })
  consentGiven!: boolean;
}

export class ComplaintCreatedEnvelopeDto {
  @ApiProperty({
    type: ComplaintCreatedDataDto,
  })
  data!: ComplaintCreatedDataDto;
}

export class ComplaintTrackingDataDto {
  @ApiProperty({
    example: 'CMS-2026-000001',
    description: 'Public reference used for tracking.',
  })
  referenceNo!: string;

  @ApiProperty({
    example: 'SUBMITTED',
    description: 'Current complaint status.',
  })
  status!: 'SUBMITTED';

  @ApiProperty({
    example: 'Road project delay in zone 3',
    description: 'Complaint subject.',
  })
  subject!: string;

  @ApiProperty({
    example: '2026-04-28T18:58:00.000Z',
    description: 'ISO-8601 submission timestamp.',
  })
  submittedAt!: string;
}

export class ComplaintTrackingEnvelopeDto {
  @ApiProperty({
    type: ComplaintTrackingDataDto,
  })
  data!: ComplaintTrackingDataDto;
}

export class ComplaintListItemDto {
  @ApiProperty({
    example: 'cmojx636z0000tc9mj1pge0zh',
    description: 'Internal complaint id.',
  })
  id!: string;

  @ApiProperty({
    example: 'CMS-2026-000001',
    description: 'Public reference used for tracking.',
  })
  referenceNo!: string;

  @ApiProperty({
    example: 'SUBMITTED',
    description: 'Current complaint status.',
  })
  status!: 'SUBMITTED';

  @ApiProperty({
    enum: ComplaintChannel,
    example: ComplaintChannel.WEB,
    description: 'Submission channel.',
  })
  channel!: ComplaintChannel;

  @ApiProperty({
    example: 'Road project delay in zone 3',
    description: 'Complaint subject.',
  })
  subject!: string;

  @ApiProperty({
    example: '2026-04-29T10:35:54.923Z',
    description: 'ISO-8601 submission timestamp.',
  })
  submittedAt!: string;

  @ApiProperty({
    enum: ComplaintLocale,
    example: ComplaintLocale.EN,
    description: 'Preferred language.',
  })
  locale!: ComplaintLocale;
}

export class ComplaintListMetaDto {
  @ApiProperty({
    example: 1,
    description: 'Current result page.',
  })
  page!: number;

  @ApiProperty({
    example: 20,
    description: 'Requested page size.',
  })
  pageSize!: number;

  @ApiProperty({
    example: 57,
    description: 'Total matching records across all pages.',
  })
  total!: number;

  @ApiProperty({
    example: 3,
    description: 'Computed page count for the current filters.',
  })
  totalPages!: number;
}

export class ComplaintListEnvelopeDto {
  @ApiProperty({
    type: [ComplaintListItemDto],
  })
  data!: ComplaintListItemDto[];

  @ApiProperty({
    type: ComplaintListMetaDto,
  })
  meta!: ComplaintListMetaDto;
}
