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
  AUTH_PASSWORD_CHANGE_COMPLETED: 'auth.password_change.completed',
  AUTH_PASSWORD_CHANGE_FAILED: 'auth.password_change.failed',
  AUTH_MFA_ENROLLED: 'auth.mfa.enrolled',
  AUTH_MFA_ENROLL_FAILED: 'auth.mfa.enroll_failed',
  AUTH_MFA_ENROLL_DEFERRED: 'auth.mfa.enroll_deferred',
  AUTH_MFA_VERIFIED: 'auth.mfa.verified',
  AUTH_MFA_VERIFY_FAILED: 'auth.mfa.verify_failed',
  AUTH_MFA_DISABLED: 'auth.mfa.disabled',
  AUTH_MFA_METHOD_CHANGED: 'auth.mfa.method_changed',
  AUTH_MFA_BACKUP_CODES_REGENERATED: 'auth.mfa.backup_codes_regenerated',
  COMPLAINT_CREATED: 'complaint.created',
  COMPLAINT_RECOVERY_REQUESTED: 'complaint.recovery.requested',
  COMPLAINT_RECOVERY_VERIFIED: 'complaint.recovery.verified',
  COMPLAINT_RECOVERY_FAILED: 'complaint.recovery.failed',
  COMPLAINT_RECOVERY_INQUIRY_CREATED: 'complaint.recovery.inquiry.created',
  COMPLAINT_RECOVERY_INQUIRY_RESOLVED: 'complaint.recovery.inquiry.resolved',
  COMPLAINT_ASSIGNED: 'complaint.assigned',
  COMPLAINT_TRANSITIONED: 'complaint.transitioned',
  COMPLAINT_ESCALATED: 'complaint.escalated',
  COMPLAINT_UPDATED: 'complaint.updated',
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
  CASE_NOTE_CREATED: 'case.note.created',
  CASE_TASK_CREATED: 'case.task.created',
  CASE_TASK_UPDATED: 'case.task.updated',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_SCAN_COMPLETED: 'document.scan.completed',
  DOCUMENT_INFECTED: 'document.infected',
  DOCUMENT_DOWNLOAD_REQUESTED: 'document.download.requested',
  DOCUMENT_DELETED: 'document.deleted',
  AUDIT_EXPORT_REQUESTED: 'audit.export.requested',
  REPORT_EXPORT_REQUESTED: 'report.export.requested',
  REPORT_EXPORT_COMPLETED: 'report.export.completed',
  REPORT_EXPORT_FAILED: 'report.export.failed',
  CONTACT_FORM_SUBMITTED: 'contact.form.submitted',
  COOKIE_CONSENT_UPDATED: 'cookie.consent.updated',
} as const;

export type AuditEventType = (typeof AUDIT_EVENT)[keyof typeof AUDIT_EVENT];

export interface AuditEventInput {
  eventType: AuditEventType;
  actorUserId?: string;
  actorRole?: string;
  /** When set, first role name is stored as actorRole if actorRole is omitted. */
  actorRoles?: string[];
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  metadata?: Prisma.JsonValue;
}
