import { staffRoutes } from "@/lib/staff/routes";
import { resolvePostLoginPath } from "@/lib/auth/post-login-redirect";
import type { SessionUser } from "@/lib/auth/session-types";

/** Next route after password change, MFA enroll, or login — without locale prefix. */
export function resolveStaffOnboardingPath(user: SessionUser): string {
  if (user.mustChangePassword) {
    return staffRoutes.auth.changePassword;
  }
  const shouldOfferMfa = !user.mfaEnrolled && user.mustEnrollMfa;
  if (shouldOfferMfa) {
    return staffRoutes.auth.mfaEnroll;
  }
  return resolvePostLoginPath(user);
}

/** After a successful password change, always surface MFA setup when not yet enrolled. */
export function resolvePostPasswordChangePath(user: SessionUser): string {
  if (!user.mfaEnrolled) {
    return staffRoutes.auth.mfaEnroll;
  }
  return resolveStaffOnboardingPath(user);
}
