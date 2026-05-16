import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCaseTaskDto {
  @ApiProperty({
    example: 'Request land registry extract',
    description: 'Short task title.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiProperty({
    example: 'user-officer-0001',
    description: 'User id of the task assignee.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  assigneeUserId!: string;

  @ApiPropertyOptional({
    example: '2026-05-20T12:00:00.000Z',
    description: 'Optional due date (ISO 8601).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}
