import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Priority } from '@prisma/client';

export { Priority };

export class CreateSlaConfigDto {
  @ApiProperty({ example: 'High-priority standard SLA' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  priority!: Priority;

  @ApiPropertyOptional({
    description:
      'Optional complaint category id. NULL means applies to all categories.',
    example: null,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiProperty({ description: 'Target resolution time in hours', example: 24 })
  @IsInt()
  @Min(1)
  targetHours!: number;

  @ApiPropertyOptional({
    description: 'Warn when this % of target hours has elapsed (1–99)',
    example: 80,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  warningThresholdPct?: number;

  @ApiPropertyOptional({ description: 'Role id to notify on breach' })
  @IsOptional()
  @IsString()
  escalationRoleId?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
