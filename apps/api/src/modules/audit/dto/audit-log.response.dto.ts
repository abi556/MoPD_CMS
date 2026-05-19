import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'auth.login.succeeded' })
  eventType!: string;

  @ApiPropertyOptional({ nullable: true, example: 'user-admin-1' })
  actorUserId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'complaint' })
  entityType?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'cmp_1' })
  entityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  correlationId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: { referenceNo: 'CMS-2026-000001' },
  })
  metadata?: unknown;

  @ApiProperty({ example: '2026-05-15T12:00:00.000Z' })
  createdAt!: string;
}

export class AuditLogListMetaDto {
  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Pass as cursor query param to fetch the next page.',
  })
  nextCursor?: string | null;
}

export class AuditLogListEnvelopeDto {
  @ApiProperty({ type: [AuditLogItemDto] })
  data!: AuditLogItemDto[];

  @ApiProperty({ type: AuditLogListMetaDto })
  meta!: AuditLogListMetaDto;
}
