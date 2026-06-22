import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { COMPLAINT_LOCALE_VALUES, type ChatbotLocale } from './chatbot-enums';

export class ChatbotHandoffDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ enum: COMPLAINT_LOCALE_VALUES })
  @IsEnum(COMPLAINT_LOCALE_VALUES)
  locale!: ChatbotLocale;

  @ApiProperty({ example: 'unanswered' })
  @IsString()
  @MaxLength(64)
  reason!: string;
}

export type ChatbotHandoffInput = Pick<
  ChatbotHandoffDto,
  'sessionId' | 'locale' | 'reason'
>;
