/** Staff console paths (no locale prefix — web adds locale). */
export const INBOX_LINK = {
  complaint: (id: string) => `/dashboard/complaints/${id}`,
  reportExports: '/dashboard/reports/exports',
  profile: '/dashboard/profile',
  profileMfa: '/dashboard/profile/mfa',
} as const;

export const INBOX_MESSAGE_KEY = {
  complaintAssigned: 'inbox.types.complaintAssigned',
  caseTaskAssigned: 'inbox.types.caseTaskAssigned',
  caseTaskReassigned: 'inbox.types.caseTaskReassigned',
  slaWarning: 'inbox.types.slaWarning',
  slaBreached: 'inbox.types.slaBreached',
  accountPasswordChanged: 'inbox.types.accountPasswordChanged',
  accountEmailChanged: 'inbox.types.accountEmailChanged',
  securityMfaReminder: 'inbox.types.securityMfaReminder',
  reportExportReady: 'inbox.types.reportExportReady',
  reportExportFailed: 'inbox.types.reportExportFailed',
} as const;

/** ISO week key for MFA reminder dedup (YYYY-Www). */
export function isoWeekDedupKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
