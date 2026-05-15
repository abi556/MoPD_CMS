import { Prisma } from '@prisma/client';

export const AUDIT_EVENT = {
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_LOGIN_LOCKED: 'auth.login.locked_out',
  AUTH_LOGIN_SUCCEEDED: 'auth.login.succeeded',
  AUTH_REFRESH_FAILED: 'auth.refresh.failed',
  AUTH_REFRESH_SUCCEEDED: 'auth.refresh.succeeded',
  AUTH_LOGOUT_FAILED: 'auth.logout.failed',
  AUTH_LOGOUT_SUCCEEDED: 'auth.logout.succeeded',
  AUTH_PASSWORD_RESET_REQUESTED: 'auth.password_reset.requested',
  AUTH_PASSWORD_RESET_COMPLETED: 'auth.password_reset.completed',
  AUTH_PASSWORD_RESET_FAILED: 'auth.password_reset.failed',
  COMPLAINT_CREATED: 'complaint.created',
  COMPLAINT_ASSIGNED: 'complaint.assigned',
  COMPLAINT_TRANSITIONED: 'complaint.transitioned',
  COMPLAINT_ESCALATED: 'complaint.escalated',
  ADMIN_PING: 'admin.ping',
  SLA_TRACKER_STARTED: 'sla.tracker.started',
  SLA_WARNING_EMITTED: 'sla.warning_emitted',
  SLA_BREACHED: 'sla.breached',
  SLA_TRACKER_COMPLETED: 'sla.tracker.completed',
  SLA_CONFIG_CREATED: 'sla.config.created',
  SLA_CONFIG_UPDATED: 'sla.config.updated',
  CATEGORY_CREATED: 'admin.category.created',
  CATEGORY_UPDATED: 'admin.category.updated',
  ORG_UNIT_CREATED: 'admin.org_unit.created',
  ORG_UNIT_UPDATED: 'admin.org_unit.updated',
  NOTIFICATION_QUEUED: 'notification.queued',
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
} as const;

export type AuditEventType = (typeof AUDIT_EVENT)[keyof typeof AUDIT_EVENT];

export interface AuditEventInput {
  eventType: AuditEventType;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  metadata?: Prisma.JsonValue;
}
