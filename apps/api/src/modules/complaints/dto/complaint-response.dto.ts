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
