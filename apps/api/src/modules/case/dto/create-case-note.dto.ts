import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CaseNoteVisibilityValue } from './case-note-visibility.enum';

export class CreateCaseNoteDto {
  @ApiProperty({
    example: 'Called complainant; awaiting land registry documents.',
    description: 'Internal note body (plain text).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  @ApiPropertyOptional({
    enum: CaseNoteVisibilityValue,
    default: CaseNoteVisibilityValue.INTERNAL,
    description: 'Note visibility tier (filtering deferred in MVP).',
  })
  @IsOptional()
  @IsEnum(CaseNoteVisibilityValue)
  visibility?: CaseNoteVisibilityValue;
}
