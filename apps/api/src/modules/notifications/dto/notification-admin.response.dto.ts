import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ComplaintLocale,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@prisma/client';

export class NotificationDeliveryItemDto {
  @ApiProperty({ example: 'ndlv_1' })
  id!: string;

  @ApiProperty({ example: 'complaint_submitted_ack' })
  templateKey!: string;

  @ApiProperty({ example: 'citizen@example.com' })
  to!: string;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty({ enum: NotificationDeliveryStatus })
  status!: NotificationDeliveryStatus;

  @ApiProperty({ example: 0 })
  retries!: number;

  @ApiPropertyOptional({ nullable: true })
  lastError?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-05-15T12:00:00.000Z' })
  sentAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  correlationId?: string | null;

  @ApiPropertyOptional({
    description:
      'Payload used for template rendering (includes internal fields).',
    example: {
      referenceNo: 'CMS-2026-000042',
      trackUrl: 'http://localhost:3000/track/CMS-2026-000042',
      __locale: 'en',
    },
  })
  payload?: unknown;

  @ApiProperty({ example: '2026-05-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class NotificationListMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class NotificationDeliveryListEnvelopeDto {
  @ApiProperty({ type: [NotificationDeliveryItemDto] })
  data!: NotificationDeliveryItemDto[];

  @ApiProperty({ type: NotificationListMetaDto })
  meta!: NotificationListMetaDto;
}

export class NotificationResendDataDto {
  @ApiProperty({
    description: 'Id of the newly queued notification delivery.',
    example: 'ndlv_99',
  })
  newDeliveryId!: string;
}

export class NotificationResendEnvelopeDto {
  @ApiProperty({ type: NotificationResendDataDto })
  data!: NotificationResendDataDto;
}

export class NotificationTemplateItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'complaint_submitted_ack' })
  key!: string;

  @ApiProperty({ enum: ComplaintLocale })
  locale!: ComplaintLocale;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  bodyHtml!: string;

  @ApiPropertyOptional({ nullable: true })
  bodyText?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class NotificationTemplateListEnvelopeDto {
  @ApiProperty({ type: [NotificationTemplateItemDto] })
  data!: NotificationTemplateItemDto[];

  @ApiProperty({ type: NotificationListMetaDto })
  meta!: NotificationListMetaDto;
}

export class NotificationTemplateEnvelopeDto {
  @ApiProperty({ type: NotificationTemplateItemDto })
  data!: NotificationTemplateItemDto;
}
