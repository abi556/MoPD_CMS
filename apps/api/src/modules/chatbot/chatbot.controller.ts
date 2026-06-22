import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ChatbotService, type ChatbotMessageResult } from './chatbot.service';
import { ChatbotHandoffDto } from './dto/chatbot-handoff.dto';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Send a message to Melhiq chatbot (public)' })
  @ApiCreatedResponse({ description: 'Bot reply with confidence and sources' })
  @ApiTooManyRequestsResponse({ description: 'Rate limited' })
  async message(
    @Body() dto: ChatbotMessageDto,
    @Req() req: Request,
  ): Promise<{ data: ChatbotMessageResult }> {
    const data = await this.chatbotService.handleMessage({
      ...dto,
      ip: req.ip,
    });
    return { data };
  }

  @Post('handoff')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Request human handoff URL (public)' })
  handoff(@Body() dto: ChatbotHandoffDto): { data: { handoffUrl: string } } {
    const data = this.chatbotService.handleHandoff(dto);
    return { data };
  }
}
