import { Injectable } from '@nestjs/common';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { AuditService } from '../audit/audit.service';
import { RecordCookieConsentDto } from './dto/record-cookie-consent.dto';

@Injectable()
export class ConsentService {
  constructor(private readonly audit: AuditService) {}

  async recordCookieConsent(
    input: RecordCookieConsentDto,
    correlationId?: string,
    userAgent?: string,
  ): Promise<{ recorded: true }> {
    await this.audit.logEvent({
      eventType: AUDIT_EVENT.COOKIE_CONSENT_UPDATED,
      entityType: 'cookie_consent',
      correlationId,
      metadata: {
        action: input.action,
        policyVersion: input.policyVersion,
        categories: {
          essential: input.categories.essential,
          analytics: input.categories.analytics,
        },
        locale: input.locale ?? null,
        userAgent: userAgent?.slice(0, 512) ?? null,
      },
    });

    return { recorded: true };
  }
}
