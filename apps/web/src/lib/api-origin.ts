/**
 * Resolves `/api/v1` prefix for client-side fetches.
 * Env: see apps/web/.env.example (`NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_API_URL`).
 * Staff auth cookie rules: mopd-cms/docs/FRONTEND_DEV.md
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
