import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CaseTaskStatusValue } from './case-task-status.enum';

export class UpdateCaseTaskDto {
  @ApiPropertyOptional({
    enum: CaseTaskStatusValue,
    example: CaseTaskStatusValue.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(CaseTaskStatusValue)
  status?: CaseTaskStatusValue;

  @ApiPropertyOptional({ example: 'Request land registry extract (updated)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ example: 'user-officer-0001' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  assigneeUserId?: string;

  @ApiPropertyOptional({ example: '2026-05-25T12:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}
