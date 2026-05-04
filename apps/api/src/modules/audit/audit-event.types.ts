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
  ADMIN_PING: 'admin.ping',
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
