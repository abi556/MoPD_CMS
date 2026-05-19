import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({
    example: 'auth.login.succeeded',
    description: 'Filter by audit event type.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventType?: string;

  @ApiPropertyOptional({
    example: 'user-admin-1',
    description: 'Filter by actor user id.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  actorUserId?: string;

  @ApiPropertyOptional({
    example: 'complaint',
    description: 'Filter by entity type.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @ApiPropertyOptional({
    example: 'cmp_1',
    description: 'Filter by entity id.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  entityId?: string;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Return logs created on or after this timestamp.',
  })
  @IsOptional()
  @IsISO8601()
  createdFrom?: string;

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.999Z',
    description: 'Return logs created on or before this timestamp.',
  })
  @IsOptional()
  @IsISO8601()
  createdTo?: string;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Opaque cursor from a previous list response.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
