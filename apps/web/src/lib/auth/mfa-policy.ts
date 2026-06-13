/** All staff may defer MFA setup during onboarding (strongly recommended, not blocking). */
export function canDeferMfaEnrollment(): boolean {
  return true;
}

/** Resolve skip visibility — always allowed until enrolled. */
export function resolveMfaEnrollCanSkip(input: {
  enrolled?: boolean;
}): boolean {
  return !input.enrolled;
}
