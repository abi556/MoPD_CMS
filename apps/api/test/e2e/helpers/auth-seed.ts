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
}
