/**
 * Resolves `/api/v1` prefix for client-side fetches.
 * Prefer `NEXT_PUBLIC_API_URL` (full prefix, documented in mopd-cms `.env.docker` / infra),
 * otherwise `NEXT_PUBLIC_API_BASE_URL` (host root only).
 */
export function resolveApiV1Prefix(): string {
  const fromPath = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (fromPath?.endsWith('/api/v1')) {
    return fromPath;
  }
  const host = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');
  if (host) {
    return `${host}/api/v1`;
  }
  return 'http://localhost:3001/api/v1';
}
