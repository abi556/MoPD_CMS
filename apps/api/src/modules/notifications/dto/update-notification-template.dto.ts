import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional({ example: 'Updated subject line' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject?: string;

  @ApiPropertyOptional({
    example: '<p>Updated HTML with {{variable}}</p>',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  bodyHtml?: string;

  @ApiPropertyOptional({ example: 'Plain text fallback' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  bodyText?: string | null;
}
