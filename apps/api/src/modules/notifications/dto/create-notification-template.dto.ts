import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintLocale, NotificationChannel } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateNotificationTemplateDto {
  @ApiProperty({ example: 'custom_welcome' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  key!: string;

  @ApiProperty({
    enum: ComplaintLocale,
    example: ComplaintLocale.en,
    description:
      'Language block for this row (en or am). Outbound emails always combine English first, then Amharic, at send time.',
  })
  @IsEnum(ComplaintLocale)
  locale!: ComplaintLocale;

  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.email,
    description: 'Only `email` is supported for rendering today.',
  })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiProperty({ example: 'Welcome to MoPD' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject!: string;

  @ApiProperty({
    example: '<p>Hello {{name}},</p><p>Thanks for registering.</p>',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  bodyHtml!: string;

  @ApiPropertyOptional({
    example: 'Hello {{name}}, thanks for registering.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  bodyText?: string;
}
