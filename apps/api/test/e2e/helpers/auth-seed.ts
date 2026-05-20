export function ensureE2eAuthSeedEnv(): void {
  process.env.AUTH_SEED_ENABLED = process.env.AUTH_SEED_ENABLED ?? 'true';
  process.env.AUTH_SEED_SUPER_ADMIN_ROLE_ID =
    process.env.AUTH_SEED_SUPER_ADMIN_ROLE_ID ?? 'role-super-admin';
  process.env.AUTH_SEED_CASE_OFFICER_ROLE_ID =
    process.env.AUTH_SEED_CASE_OFFICER_ROLE_ID ?? 'role-case-officer';
  process.env.AUTH_SEED_SUPER_ADMIN_ID =
    process.env.AUTH_SEED_SUPER_ADMIN_ID ?? 'user-admin-0001';
  process.env.AUTH_SEED_SUPER_ADMIN_EMAIL =
    process.env.AUTH_SEED_SUPER_ADMIN_EMAIL ?? 'admin@mopd.local';
  process.env.AUTH_SEED_SUPER_ADMIN_PASSWORD =
    process.env.AUTH_SEED_SUPER_ADMIN_PASSWORD ?? 'AdminPass123!';
  process.env.AUTH_SEED_CASE_OFFICER_ID =
    process.env.AUTH_SEED_CASE_OFFICER_ID ?? 'user-officer-0001';
  process.env.AUTH_SEED_CASE_OFFICER_EMAIL =
    process.env.AUTH_SEED_CASE_OFFICER_EMAIL ?? 'officer@mopd.local';
  process.env.AUTH_SEED_CASE_OFFICER_PASSWORD =
    process.env.AUTH_SEED_CASE_OFFICER_PASSWORD ?? 'OfficerPass123!';
  process.env.AUTH_SEED_CASE_OFFICER_2_ID =
    process.env.AUTH_SEED_CASE_OFFICER_2_ID ?? 'user-officer-0002';
  process.env.AUTH_SEED_CASE_OFFICER_2_EMAIL =
    process.env.AUTH_SEED_CASE_OFFICER_2_EMAIL ?? 'officer2@mopd.local';
  process.env.AUTH_SEED_CASE_OFFICER_2_PASSWORD =
    process.env.AUTH_SEED_CASE_OFFICER_2_PASSWORD ?? 'Officer2Pass123!';
  process.env.AUTH_SEED_SYSTEM_ADMIN_ID =
    process.env.AUTH_SEED_SYSTEM_ADMIN_ID ?? 'user-system-admin-0001';
  process.env.AUTH_SEED_SYSTEM_ADMIN_EMAIL =
    process.env.AUTH_SEED_SYSTEM_ADMIN_EMAIL ?? 'system-admin@mopd.local';
  process.env.AUTH_SEED_SYSTEM_ADMIN_PASSWORD =
    process.env.AUTH_SEED_SYSTEM_ADMIN_PASSWORD ?? 'SystemAdminPass123!';
  process.env.AUTH_SEED_COMPLAINTS_ADMIN_ID =
    process.env.AUTH_SEED_COMPLAINTS_ADMIN_ID ?? 'user-complaints-admin-0001';
  process.env.AUTH_SEED_COMPLAINTS_ADMIN_EMAIL =
    process.env.AUTH_SEED_COMPLAINTS_ADMIN_EMAIL ??
    'complaints-admin@mopd.local';
  process.env.AUTH_SEED_COMPLAINTS_ADMIN_PASSWORD =
    process.env.AUTH_SEED_COMPLAINTS_ADMIN_PASSWORD ??
    'ComplaintsAdminPass123!';
  process.env.AUTH_SEED_REVIEWER_ID =
    process.env.AUTH_SEED_REVIEWER_ID ?? 'user-reviewer-0001';
  process.env.AUTH_SEED_REVIEWER_EMAIL =
    process.env.AUTH_SEED_REVIEWER_EMAIL ?? 'reviewer@mopd.local';
  process.env.AUTH_SEED_REVIEWER_PASSWORD =
    process.env.AUTH_SEED_REVIEWER_PASSWORD ?? 'ReviewerPass123!';
  process.env.AUTH_SEED_COMMUNICATIONS_ID =
    process.env.AUTH_SEED_COMMUNICATIONS_ID ?? 'user-communications-0001';
  process.env.AUTH_SEED_COMMUNICATIONS_EMAIL =
    process.env.AUTH_SEED_COMMUNICATIONS_EMAIL ?? 'communications@mopd.local';
  process.env.AUTH_SEED_COMMUNICATIONS_PASSWORD =
    process.env.AUTH_SEED_COMMUNICATIONS_PASSWORD ?? 'CommunicationsPass123!';
  process.env.AUTH_SEED_AUDITOR_ID =
    process.env.AUTH_SEED_AUDITOR_ID ?? 'user-auditor-0001';
  process.env.AUTH_SEED_AUDITOR_EMAIL =
    process.env.AUTH_SEED_AUDITOR_EMAIL ?? 'auditor@mopd.local';
  process.env.AUTH_SEED_AUDITOR_PASSWORD =
    process.env.AUTH_SEED_AUDITOR_PASSWORD ?? 'AuditorPass123!';
  process.env.AUTH_SEED_OMBUDSPERSON_ID =
    process.env.AUTH_SEED_OMBUDSPERSON_ID ?? 'user-ombudsperson-0001';
  process.env.AUTH_SEED_OMBUDSPERSON_EMAIL =
    process.env.AUTH_SEED_OMBUDSPERSON_EMAIL ?? 'ombudsperson@mopd.local';
  process.env.AUTH_SEED_OMBUDSPERSON_PASSWORD =
    process.env.AUTH_SEED_OMBUDSPERSON_PASSWORD ?? 'OmbudspersonPass123!';
  process.env.AUTH_SEED_OBSERVER_ID =
    process.env.AUTH_SEED_OBSERVER_ID ?? 'user-observer-0001';
  process.env.AUTH_SEED_OBSERVER_EMAIL =
    process.env.AUTH_SEED_OBSERVER_EMAIL ?? 'observer@mopd.local';
  process.env.AUTH_SEED_OBSERVER_PASSWORD =
    process.env.AUTH_SEED_OBSERVER_PASSWORD ?? 'ObserverPass123!';
  process.env.DOCUMENT_STORAGE_DRIVER =
    process.env.DOCUMENT_STORAGE_DRIVER ?? 'memory';
  process.env.VIRUS_SCANNER = process.env.VIRUS_SCANNER ?? 'noop';
}
