import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEventInput } from './audit-event.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(event: AuditEventInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: event.eventType,
          actorUserId: event.actorUserId ?? null,
          entityType: event.entityType ?? null,
          entityId: event.entityId ?? null,
          correlationId: event.correlationId ?? null,
          metadata: event.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist audit event: ${event.eventType}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
