import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { TransformOptionalUuid } from '../../../common/dto/transform-optional-uuid';

export class DashboardReportQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  @Transform(
    ({ value }: { value: unknown }): 'day' | 'week' | 'month' | undefined => {
      if (value === '' || value === undefined || value === null) {
        return undefined;
      }
      if (value === 'day' || value === 'week' || value === 'month') {
        return value;
      }
      return undefined;
    },
  )
  bucket?: 'day' | 'week' | 'month';

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Optional category filter. Omit this field (or leave blank) to include all categories.',
  })
  @TransformOptionalUuid()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Optional org unit filter. Omit this field (or leave blank) to include all org units.',
  })
  @TransformOptionalUuid()
  @IsOptional()
  @IsUUID()
  orgUnitId?: string;
}
