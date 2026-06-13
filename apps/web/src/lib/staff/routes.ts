/** Central staff route map — no locale prefix. */

export const staffRoutes = {
  home: "/dashboard",
  complaints: "/dashboard/complaints",
  complaintDetail: (id: string) => `/dashboard/complaints/${id}`,
  recoveryInquiries: "/dashboard/recovery-inquiries",
  notifications: "/dashboard/notifications",
  reports: {
    root: "/dashboard/reports",
    volume: "/dashboard/reports/volume",
    sla: "/dashboard/reports/sla",
    resolution: "/dashboard/reports/resolution",
    channels: "/dashboard/reports/channels",
    exports: "/dashboard/reports/exports",
  },
  admin: {
    root: "/dashboard/admin",
    users: "/dashboard/admin/users",
    roles: "/dashboard/admin/roles",
    categories: "/dashboard/admin/categories",
    orgUnits: "/dashboard/admin/org-units",
    sla: "/dashboard/admin/sla",
    templates: "/dashboard/admin/templates",
    notifications: "/dashboard/admin/notifications",
    audit: "/dashboard/admin/audit",
    system: "/dashboard/admin/system",
  },
  auth: {
    login: "/auth/login",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    sessionExpired: "/auth/session-expired",
    changePassword: "/auth/change-password",
    mfaEnroll: "/auth/mfa/enroll",
    mfaVerify: "/auth/mfa/verify",
    ssoCallback: "/auth/sso/callback",
  },
  forbidden: "/forbidden",
  profile: "/dashboard/profile",
} as const;

const STAFF_BASE_PATH =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_STAFF_BASE_PATH ?? "")
    : "";

/** Prefix a staff path with optional base (future subdomain split). */
export function staffPath(path: string): string {
  if (!STAFF_BASE_PATH) {
    return path;
  }
  const base = STAFF_BASE_PATH.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Append query string to a staff path. */
export function staffPathWithQuery(
  path: string,
  query: Record<string, string>,
): string {
  const params = new URLSearchParams(query);
  return `${path}?${params.toString()}`;
}
