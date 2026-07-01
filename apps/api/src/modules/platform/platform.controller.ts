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
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { ContactService } from './contact.service';
import { ConsentService } from './consent.service';
import { AnalyticsService } from './analytics.service';
import { RecordCookieConsentDto } from './dto/record-cookie-consent.dto';
import { RecordAnalyticsEventsDto } from './dto/record-analytics-events.dto';
import { SubmitContactDto } from './dto/submit-contact.dto';

@ApiTags('platform')
@Controller()
export class PlatformController {
  constructor(
    private readonly contactService: ContactService,
    private readonly consentService: ConsentService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Submit public contact form (first-party)' })
  @ApiCreatedResponse({ description: 'Message accepted for delivery' })
  @ApiTooManyRequestsResponse({ description: 'Rate limited' })
  async submitContact(
    @Body() body: SubmitContactDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<{ data: { message: string } }> {
    const data = await this.contactService.submit(body, req.correlationId);
    return { data };
  }

  @Post('consent/cookie')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Record cookie consent choice for audit trail' })
  @ApiCreatedResponse({ description: 'Consent recorded' })
  @ApiTooManyRequestsResponse({ description: 'Rate limited' })
  async recordCookieConsent(
    @Body() body: RecordCookieConsentDto,
    @Req() req: Request & RequestWithCorrelationId,
  ): Promise<{ data: { recorded: true } }> {
    const data = await this.consentService.recordCookieConsent(
      body,
      req.correlationId,
      req.headers['user-agent'],
    );
    return { data };
  }

  @Post('analytics/events')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @ApiOperation({
    summary: 'Record first-party web analytics events (consent-gated client)',
  })
  @ApiCreatedResponse({ description: 'Events accepted' })
  @ApiTooManyRequestsResponse({ description: 'Rate limited' })
  async recordAnalyticsEvents(
    @Body() body: RecordAnalyticsEventsDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<{ data: { recorded: number } }> {
    const data = await this.analyticsService.recordEvents(
      body,
      req.correlationId,
    );
    return { data };
  }
}
