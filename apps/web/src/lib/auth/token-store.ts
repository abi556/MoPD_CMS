let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * A non-httpOnly "hint" cookie that signals a staff session may exist.
 * The real refresh token is httpOnly and unreadable by JS, so this lightweight
 * marker lets the client skip session-bootstrap network calls (and the
 * resulting 401s) for anonymous public visitors who never signed in.
 */
const SESSION_HINT_COOKIE = "mopd_session_hint";

export function hasSessionHint(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${SESSION_HINT_COOKIE}=`));
}

export function setSessionHint(): void {
  if (typeof document === "undefined") {
    return;
  }
  // Session cookie (no Max-Age) so it lives for the browser session; the
  // server-side httpOnly refresh cookie remains the real source of truth.
  document.cookie = `${SESSION_HINT_COOKIE}=1; Path=/; SameSite=Lax`;
}

export function clearSessionHint(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
