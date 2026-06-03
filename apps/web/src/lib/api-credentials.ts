/**
 * Fetch credential policy for MoPD CMS API (Phase 0).
 * Phase 1 `api-client` should import these helpers — do not duplicate rules.
 *
 * @see mopd-cms/docs/FRONTEND_DEV.md §4
 * @see mopd-cms/docs/API.md §4 Authentication
 */

export type ApiCredentialsMode = RequestCredentials;

/** Paths under `/api/v1` that require the refresh cookie (`credentials: 'include'`). */
export const AUTH_COOKIE_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
] as const;

export function isAuthCookiePath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return AUTH_COOKIE_PATHS.some(
    (segment) =>
      normalized === segment || normalized.endsWith(segment),
  );
}

/**
 * Public citizen routes — never send Bearer or cookies.
 */
export function isPublicApiPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/complaints' || normalized.startsWith('/complaints/track')) {
    return true;
  }
  if (normalized === '/complaints/form-options') {
    return true;
  }
  if (/^\/complaints\/[^/]+\/evidence$/.test(normalized)) {
    return true;
  }
  if (
    normalized.startsWith('/auth/forgot-password') ||
    normalized.startsWith('/auth/reset-password')
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves `fetch` credentials for a relative API path (e.g. `/auth/refresh`).
 */
export function resolveApiCredentials(path: string): ApiCredentialsMode {
  if (isPublicApiPath(path)) {
    return 'omit';
  }
  if (isAuthCookiePath(path)) {
    return 'include';
  }
  return 'omit';
}
