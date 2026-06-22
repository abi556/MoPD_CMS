import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ChatbotAuditRepository } from './chatbot-audit.repository';

@Injectable()
export class ChatbotAuditService {
  constructor(private readonly auditRepo: ChatbotAuditRepository) {}

  hashIp(ip: string | undefined): string | null {
    if (!ip) return null;
    return createHash('sha256').update(ip).digest('hex').slice(0, 32);
  }

  purgeExpiredSessions(): Promise<number> {
    return this.auditRepo.deleteExpiredSessions(new Date());
  }

  purgeOldMessages(retentionDays = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    return this.auditRepo.deleteOldMessages(cutoff);
  }
}
