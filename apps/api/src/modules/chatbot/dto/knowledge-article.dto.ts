import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  COMPLAINT_LOCALE_VALUES,
  KNOWLEDGE_ARTICLE_STATUS_VALUES,
  KNOWLEDGE_SOURCE_TYPE_VALUES,
  type ChatbotLocale,
  type KnowledgeArticleStatusValue,
  type KnowledgeSourceTypeValue,
} from './chatbot-enums';

export class CreateKnowledgeArticleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ enum: COMPLAINT_LOCALE_VALUES })
  @IsEnum(COMPLAINT_LOCALE_VALUES)
  locale!: ChatbotLocale;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  bodyMarkdown!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  topic!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ enum: KNOWLEDGE_SOURCE_TYPE_VALUES })
  @IsOptional()
  @IsEnum(KNOWLEDGE_SOURCE_TYPE_VALUES)
  sourceType?: KnowledgeSourceTypeValue;
}

export class UpdateKnowledgeArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  bodyMarkdown?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  sourceUrl?: string | null;

  @ApiPropertyOptional({ enum: KNOWLEDGE_SOURCE_TYPE_VALUES })
  @IsOptional()
  @IsEnum(KNOWLEDGE_SOURCE_TYPE_VALUES)
  sourceType?: KnowledgeSourceTypeValue;

  @ApiPropertyOptional({ enum: KNOWLEDGE_ARTICLE_STATUS_VALUES })
  @IsOptional()
  @IsEnum(KNOWLEDGE_ARTICLE_STATUS_VALUES)
  status?: KnowledgeArticleStatusValue;
}

export class KnowledgeArticleListQueryDto {
  @ApiPropertyOptional({ enum: KNOWLEDGE_ARTICLE_STATUS_VALUES })
  @IsOptional()
  @IsEnum(KNOWLEDGE_ARTICLE_STATUS_VALUES)
  status?: KnowledgeArticleStatusValue;

  @ApiPropertyOptional({ enum: COMPLAINT_LOCALE_VALUES })
  @IsOptional()
  @IsEnum(COMPLAINT_LOCALE_VALUES)
  locale?: ChatbotLocale;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;
}
