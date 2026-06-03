import type { ComplaintUploadSession } from "@/lib/public-complaints";

/** Call from event handlers only (uses current time). */
export function isUploadSessionExpired(
  session: ComplaintUploadSession | null,
  nowMs: number = Date.now(),
): boolean {
  if (!session) {
    return true;
  }
  if (!session.expiresAt) {
    return false;
  }
  return nowMs > new Date(session.expiresAt).getTime();
}
