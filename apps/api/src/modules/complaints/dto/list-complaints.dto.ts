import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ComplaintChannel, ComplaintLocale } from './create-complaint.dto';
import { ComplaintStatusValue } from './complaint-status.enum';

export class ListComplaintsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Page number starting from 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'How many records to return in one page.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    example: ComplaintStatusValue.SUBMITTED,
    enum: ComplaintStatusValue,
    description: 'Filter by complaint workflow status.',
  })
  @IsOptional()
  @IsEnum(ComplaintStatusValue)
  status?: ComplaintStatusValue;

  @ApiPropertyOptional({
    enum: ComplaintChannel,
    example: ComplaintChannel.WEB,
    description: 'Filter by complaint intake channel.',
  })
  @IsOptional()
  @IsEnum(ComplaintChannel)
  channel?: ComplaintChannel;

  @ApiPropertyOptional({
    enum: ComplaintLocale,
    example: ComplaintLocale.EN,
    description: 'Filter by preferred complaint language.',
  })
  @IsOptional()
  @IsEnum(ComplaintLocale)
  locale?: ComplaintLocale;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Return complaints submitted on or after this timestamp.',
  })
  @IsOptional()
  @IsISO8601()
  submittedFrom?: string;

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.999Z',
    description: 'Return complaints submitted on or before this timestamp.',
  })
  @IsOptional()
  @IsISO8601()
  submittedTo?: string;
}
