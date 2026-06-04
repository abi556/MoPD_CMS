import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ComplaintLocale } from './create-complaint.dto';

export enum RecoveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

export class RecoveryRequestDto {
  @ApiProperty({ enum: RecoveryChannel, example: RecoveryChannel.EMAIL })
  @IsEnum(RecoveryChannel)
  channel!: RecoveryChannel;

  @ApiPropertyOptional({ example: 'abebe@example.com' })
  @ValidateIf((o: RecoveryRequestDto) => o.channel === RecoveryChannel.EMAIL)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  @ValidateIf((o: RecoveryRequestDto) => o.channel === RecoveryChannel.SMS)
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @ApiProperty({ enum: ComplaintLocale, example: ComplaintLocale.EN })
  @IsEnum(ComplaintLocale)
  locale!: ComplaintLocale;
}

export class RecoveryVerifyDto extends RecoveryRequestDto {
  @ApiProperty({
    example: '123456',
    description: 'One-time verification code.',
  })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
