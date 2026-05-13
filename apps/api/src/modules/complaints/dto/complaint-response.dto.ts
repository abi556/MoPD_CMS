import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintChannel, ComplaintLocale } from './create-complaint.dto';
import { ComplaintStatusValue } from './complaint-status.enum';

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
    enum: ComplaintStatusValue,
    example: ComplaintStatusValue.SUBMITTED,
    description: 'Current complaint status.',
  })
  status!: ComplaintStatusValue;

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

  @ApiPropertyOptional({
    nullable: true,
    description: 'Selected complaint category id when provided at intake.',
  })
  categoryId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Selected organizational unit id when provided at intake.',
  })
  orgUnitId?: string | null;
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
    enum: ComplaintStatusValue,
    example: ComplaintStatusValue.SUBMITTED,
    description: 'Current complaint status.',
  })
  status!: ComplaintStatusValue;

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
    enum: ComplaintStatusValue,
    example: ComplaintStatusValue.SUBMITTED,
    description: 'Current complaint status.',
  })
  status!: ComplaintStatusValue;

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

  @ApiPropertyOptional({
    nullable: true,
    description: 'Complaint category id.',
  })
  categoryId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Organizational unit id.',
  })
  orgUnitId?: string | null;
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

export class ComplaintDetailDataDto {
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
    enum: ComplaintStatusValue,
    example: ComplaintStatusValue.SUBMITTED,
    description: 'Current complaint status.',
  })
  status!: ComplaintStatusValue;

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
    example:
      'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
    description: 'Full complaint narrative text.',
  })
  description!: string;

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

  @ApiProperty({
    example: true,
    description: 'Consent acknowledgement flag.',
  })
  consentGiven!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Complaint category id.',
  })
  categoryId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Organizational unit id.',
  })
  orgUnitId?: string | null;

  @ApiProperty({
    example: 'Abebe Kebede',
    nullable: true,
    description: 'Optional complainant name.',
  })
  complainantName!: string | null;

  @ApiProperty({
    example: 'abebe@example.com',
    nullable: true,
    description: 'Optional complainant email.',
  })
  complainantEmail!: string | null;

  @ApiProperty({
    example: '+251911223344',
    nullable: true,
    description: 'Optional complainant phone.',
  })
  complainantPhone!: string | null;

  @ApiProperty({
    example: 'user-officer-0001',
    nullable: true,
    description: 'Current assignee user id.',
  })
  assignedToUserId!: string | null;

  @ApiProperty({
    example: 'user-admin-0001',
    nullable: true,
    description: 'Actor who last performed assignment.',
  })
  assignedByUserId!: string | null;

  @ApiProperty({
    example: '2026-04-29T12:05:00.000Z',
    nullable: true,
    description: 'ISO-8601 assignment timestamp.',
  })
  assignedAt!: string | null;

  @ApiProperty({
    example: 'Routing based on transport infrastructure expertise.',
    nullable: true,
    description: 'Optional assignment rationale.',
  })
  assignmentReason!: string | null;

  @ApiProperty({
    example: 'user-officer-0001',
    nullable: true,
    description: 'Actor who performed the latest status transition.',
  })
  lastTransitionByUserId!: string | null;

  @ApiProperty({
    example: '2026-04-29T12:30:00.000Z',
    nullable: true,
    description: 'ISO-8601 timestamp of latest status transition.',
  })
  lastTransitionAt!: string | null;

  @ApiProperty({
    example: 'Field verification started by assigned officer.',
    nullable: true,
    description: 'Reason for latest status transition.',
  })
  lastTransitionReason!: string | null;
}

export class ComplaintDetailEnvelopeDto {
  @ApiProperty({
    type: ComplaintDetailDataDto,
  })
  data!: ComplaintDetailDataDto;
}

export class ComplaintHistoryItemDto {
  @ApiProperty({
    example: 'cmok1history0001',
    description: 'Immutable history event id.',
  })
  id!: string;

  @ApiProperty({
    example: 'ASSIGNED',
    enum: ['ASSIGNED', 'TRANSITIONED'],
    description: 'History event type.',
  })
  action!: 'ASSIGNED' | 'TRANSITIONED';

  @ApiProperty({
    enum: ComplaintStatusValue,
    nullable: true,
    example: ComplaintStatusValue.SUBMITTED,
    description: 'Workflow status before this event.',
  })
  fromStatus!: ComplaintStatusValue | null;

  @ApiProperty({
    enum: ComplaintStatusValue,
    example: ComplaintStatusValue.ASSIGNED,
    description: 'Workflow status after this event.',
  })
  toStatus!: ComplaintStatusValue;

  @ApiProperty({
    example: 'user-officer-0001',
    description: 'User id of event actor.',
  })
  actorUserId!: string;

  @ApiProperty({
    example: 'Routing based on transport infrastructure expertise.',
    nullable: true,
    description: 'Optional reason/comment for this event.',
  })
  reason!: string | null;

  @ApiProperty({
    example: '2026-04-29T12:30:00.000Z',
    description: 'ISO-8601 event creation timestamp.',
  })
  createdAt!: string;
}

export class ComplaintHistoryEnvelopeDto {
  @ApiProperty({
    type: [ComplaintHistoryItemDto],
  })
  data!: ComplaintHistoryItemDto[];
}
