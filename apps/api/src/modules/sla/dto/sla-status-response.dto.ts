import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SlaStatusResponseDto {
  @ApiProperty()
  complaintId!: string;

  @ApiProperty()
  slaConfigName!: string;

  @ApiProperty({ enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'BREACHED'] })
  status!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty()
  targetAt!: string;

  @ApiProperty()
  warningAt!: string;

  @ApiPropertyOptional()
  warnedAt?: string | null;

  @ApiPropertyOptional()
  breachedAt?: string | null;

  @ApiPropertyOptional()
  completedAt?: string | null;

  @ApiProperty({
    description: 'Milliseconds remaining until target (negative if past due)',
  })
  remainingMs!: number;

  @ApiProperty()
  isWarned!: boolean;

  @ApiProperty()
  isBreached!: boolean;
}

export class SlaConfigResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  priority!: string;

  @ApiPropertyOptional()
  categoryId!: string | null;

  @ApiProperty()
  targetHours!: number;

  @ApiProperty()
  warningThresholdPct!: number;

  @ApiPropertyOptional()
  escalationRoleId!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;
}
