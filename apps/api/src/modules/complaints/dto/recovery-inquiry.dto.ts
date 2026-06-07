import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ComplaintLocale } from './create-complaint.dto';
import { ReferenceRecoveryInquiryStatus } from '@prisma/client';

export class CreateRecoveryInquiryDto {
  @ApiProperty({ example: 'Road delay near market', minLength: 5 })
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  subjectFragment!: string;

  @ApiPropertyOptional({ example: '2018-06-15' })
  @IsOptional()
  @IsISO8601({ strict: false })
  submittedDateGregorian?: string;

  @ApiPropertyOptional({ example: '10 ሕዳር 2010' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  submittedDateEthiopian?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiProperty({
    example: 'citizen@example.com',
    description:
      'Email for MoPD to send the recovered reference or outcome (staff review is not instant).',
  })
  @IsEmail()
  @MaxLength(254)
  contactEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalNotes?: string;

  @ApiProperty({ enum: ComplaintLocale })
  @IsEnum(ComplaintLocale)
  locale!: ComplaintLocale;
}

export class ResolveRecoveryInquiryDto {
  @ApiProperty({ enum: ReferenceRecoveryInquiryStatus })
  @IsEnum(ReferenceRecoveryInquiryStatus)
  status!: ReferenceRecoveryInquiryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matchedComplaintId?: string;

  @ApiPropertyOptional({ example: 'CMS-2026-ABCD1234WXYZ' })
  @IsOptional()
  @IsString()
  resolvedReferenceNo?: string;
}

export class ListRecoveryInquiriesQueryDto {
  @ApiPropertyOptional({ enum: ReferenceRecoveryInquiryStatus })
  @IsOptional()
  @IsEnum(ReferenceRecoveryInquiryStatus)
  status?: ReferenceRecoveryInquiryStatus;
}

export class RecoveryInquiryCreatedDataDto {
  @ApiProperty()
  inquiryId!: string;

  @ApiProperty()
  message!: string;
}

export class RecoveryInquiryItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ReferenceRecoveryInquiryStatus })
  status!: ReferenceRecoveryInquiryStatus;

  @ApiProperty()
  locale!: string;

  @ApiProperty()
  subjectFragment!: string;

  @ApiPropertyOptional()
  submittedDateGregorian?: string | null;

  @ApiPropertyOptional()
  submittedDateEthiopian?: string | null;

  @ApiPropertyOptional()
  categoryId?: string | null;

  @ApiPropertyOptional()
  orgUnitId?: string | null;

  @ApiProperty()
  contactEmail!: string;

  @ApiPropertyOptional()
  additionalNotes?: string | null;

  @ApiPropertyOptional()
  matchedComplaintId?: string | null;

  @ApiPropertyOptional()
  resolvedReferenceNo?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class RecoveryInquiryCreatedEnvelopeDto {
  @ApiProperty({ type: RecoveryInquiryCreatedDataDto })
  data!: RecoveryInquiryCreatedDataDto;
}

export class RecoveryInquiryListEnvelopeDto {
  @ApiProperty({ type: [RecoveryInquiryItemDto] })
  data!: RecoveryInquiryItemDto[];
}

export class RecoveryInquiryEnvelopeDto {
  @ApiProperty({ type: RecoveryInquiryItemDto })
  data!: RecoveryInquiryItemDto;
}

export class RecoveryInquiryCandidateDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'CMS-2026-ABCD1234WXYZ' })
  referenceNo!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  submittedAt!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  complainantEmail?: string | null;
}

export class RecoveryInquiryCandidatesEnvelopeDto {
  @ApiProperty({ type: [RecoveryInquiryCandidateDto] })
  data!: RecoveryInquiryCandidateDto[];
}
