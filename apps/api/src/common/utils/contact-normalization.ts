/** Lowercase trimmed email for complainant matching. */
export function normalizeComplainantEmail(email: string): string {
  return email.trim().toLowerCase();
}
