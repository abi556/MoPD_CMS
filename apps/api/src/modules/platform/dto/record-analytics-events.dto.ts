import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const WEB_ANALYTICS_EVENT_TYPES = [
  'page.view',
  'funnel.start',
  'funnel.step_view',
  'funnel.step_complete',
  'funnel.submit_start',
  'funnel.submit_success',
  'funnel.submit_error',
  'funnel.evidence_open',
  'funnel.evidence_complete',
  'funnel.abandon',
  'contact.submit_success',
  'chat.open',
  'chat.message_sent',
  'chat.quick_action',
  'track.search_success',
  'track.search_not_found',
] as const;

export type WebAnalyticsEventType = (typeof WEB_ANALYTICS_EVENT_TYPES)[number];

export class WebAnalyticsEventDto {
  @ApiProperty({ example: 'page.view', enum: WEB_ANALYTICS_EVENT_TYPES })
  @IsIn(WEB_ANALYTICS_EVENT_TYPES)
  eventType!: WebAnalyticsEventType;

  @ApiPropertyOptional({ example: '/en/complaints/new' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  pagePath?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsIn(['en', 'am'])
  locale?: 'en' | 'am';

  @ApiPropertyOptional({ example: 'complaint_submit' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  funnelName?: string;

  @ApiPropertyOptional({ example: 'details' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  funnelStep?: string;

  @ApiPropertyOptional({ example: 'wizard' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  funnelPhase?: string;

  @ApiPropertyOptional({ example: 'mobile', enum: ['mobile', 'tablet', 'desktop'] })
  @IsOptional()
  @IsIn(['mobile', 'tablet', 'desktop'])
  deviceClass?: 'mobile' | 'tablet' | 'desktop';

  @ApiPropertyOptional({
    example: 'direct',
    enum: ['direct', 'search', 'social', 'referral'],
  })
  @IsOptional()
  @IsIn(['direct', 'search', 'social', 'referral'])
  referrerCategory?: 'direct' | 'search' | 'social' | 'referral';

  @ApiPropertyOptional({ example: { quickActionId: 'track' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string | number | boolean>;
}

export class RecordAnalyticsEventsDto {
  @ApiProperty({ example: 'a1b2c3d4-session-id' })
  @IsString()
  @MaxLength(64)
  sessionId!: string;

  @ApiProperty({ type: [WebAnalyticsEventDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => WebAnalyticsEventDto)
  events!: WebAnalyticsEventDto[];
}
