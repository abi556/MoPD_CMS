import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateSlaConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Target resolution time in hours' })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetHours?: number;

  @ApiPropertyOptional({ description: 'Warn % of target hours (1–99)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  warningThresholdPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escalationRoleId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
