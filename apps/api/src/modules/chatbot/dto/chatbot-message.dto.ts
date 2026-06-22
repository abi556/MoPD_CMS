import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { COMPLAINT_LOCALE_VALUES, type ChatbotLocale } from './chatbot-enums';

export class ChatbotMessageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  @ApiProperty({ enum: COMPLAINT_LOCALE_VALUES })
  @IsEnum(COMPLAINT_LOCALE_VALUES)
  locale!: ChatbotLocale;
}

export type ChatbotMessageInput = Pick<
  ChatbotMessageDto,
  'sessionId' | 'message' | 'locale'
>;
