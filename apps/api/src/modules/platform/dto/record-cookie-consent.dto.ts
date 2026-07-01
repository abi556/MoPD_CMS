import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CookieConsentCategoriesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  essential!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  analytics!: boolean;
}

export class RecordCookieConsentDto {
  @ApiProperty({
    enum: ['accept_all', 'reject_non_essential', 'save_preferences'],
  })
  @IsIn(['accept_all', 'reject_non_essential', 'save_preferences'])
  action!: 'accept_all' | 'reject_non_essential' | 'save_preferences';

  @ApiProperty({ example: '2026-06-01' })
  @IsString()
  @MaxLength(32)
  policyVersion!: string;

  @ApiProperty({ type: CookieConsentCategoriesDto })
  @ValidateNested()
  @Type(() => CookieConsentCategoriesDto)
  @IsObject()
  categories!: CookieConsentCategoriesDto;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;
}
