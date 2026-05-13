import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum ComplaintChannel {
  WEB = 'WEB',
  ASSISTED = 'ASSISTED',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  USSD = 'USSD',
}

export enum ComplaintLocale {
  EN = 'en',
  AM = 'am',
}

export class CreateComplaintDto {
  @ApiProperty({
    example: 'Road project delay in zone 3',
    description: 'Short complaint subject.',
    minLength: 5,
    maxLength: 160,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  subject!: string;

  @ApiProperty({
    example:
      'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
    description: 'Detailed complaint description.',
    minLength: 20,
    maxLength: 4000,
  })
  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description!: string;

  @ApiProperty({
    enum: ComplaintChannel,
    example: ComplaintChannel.WEB,
    description: 'Submission channel for the complaint.',
  })
  @IsEnum(ComplaintChannel)
  channel!: ComplaintChannel;

  @ApiPropertyOptional({
    example: 'Abebe Kebede',
    description: 'Optional complainant full name.',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  complainantName?: string;

  @ApiPropertyOptional({
    example: 'abebe@example.com',
    description: 'Optional complainant email.',
  })
  @IsOptional()
  @IsEmail()
  complainantEmail?: string;

  @ApiPropertyOptional({
    example: '+251911223344',
    description: 'Optional complainant phone number in E.164 format.',
  })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  complainantPhone?: string;

  @ApiPropertyOptional({
    description:
      'Complaint category ID. Must match an active ComplaintCategory.',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description:
      'Optional organizational unit ID. Must match an active OrgUnit.',
  })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiProperty({
    example: true,
    description: 'Must be true to acknowledge data processing consent.',
  })
  @Equals(true, { message: 'consentGiven must be true' })
  consentGiven!: boolean;

  @ApiProperty({
    enum: ComplaintLocale,
    example: ComplaintLocale.EN,
    description: 'Preferred language for follow-up communication.',
  })
  @IsEnum(ComplaintLocale)
  locale!: ComplaintLocale;
}
