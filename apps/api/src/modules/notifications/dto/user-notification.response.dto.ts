import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserNotificationSeverity, UserNotificationType } from '@prisma/client';

export class UserNotificationItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: UserNotificationType;

  @ApiProperty()
  severity!: UserNotificationSeverity;

  @ApiProperty()
  messageKey!: string;

  @ApiPropertyOptional({ nullable: true })
  messageParams!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  link!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class UserNotificationListMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class UserNotificationListEnvelopeDto {
  @ApiProperty({ type: [UserNotificationItemDto] })
  data!: UserNotificationItemDto[];

  @ApiProperty({ type: UserNotificationListMetaDto })
  meta!: UserNotificationListMetaDto;
}

export class UserNotificationUnreadCountEnvelopeDto {
  @ApiProperty({ example: { count: 3 } })
  data!: { count: number };
}

export class UserNotificationMarkAllReadEnvelopeDto {
  @ApiProperty({ example: { updated: 5 } })
  data!: { updated: number };
}

export class UserNotificationEnvelopeDto {
  @ApiProperty({ type: UserNotificationItemDto })
  data!: UserNotificationItemDto;
}
