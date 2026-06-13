# MoPD CMS — Frontend local development

Guide for `apps/web` Phase 0+ setup against the NestJS API. API contracts: [API.md](./API.md). Permissions: [RBAC.md](./RBAC.md). UI spec: [MoPD_CMS_Frontend_UI_Plan.md](../../CMS%20SRS%20+%20SDS/MoPD_CMS_Frontend_UI_Plan.md). Staff console plan (one app, admin-first): [MoPD_CMS_Staff_Console_Plan.md](../../CMS%20SRS%20+%20SDS/MoPD_CMS_Staff_Console_Plan.md).

---

## 1. Prerequisites

1. **Node.js** ≥ 22, **pnpm** 10.x (see root `packageManager` in `mopd-cms/package.json`).
2. **Infrastructure:** Postgres, Redis, and other services per [README.md](../README.md) and `apps/api/.env`.
3. Install dependencies from repo root:

```bash
cd mopd-cms
pnpm install
```

---

## 2. Run web and API

From `mopd-cms/`:

```bash
# Both apps (Turbo)
pnpm dev

# Or individually
pnpm --filter @mopd-cms/api dev
pnpm --filter @mopd-cms/web dev
```

| Service | URL |
|---------|-----|
| Web (Next.js) | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| API health | http://localhost:3001/api/v1/health |
| Swagger | http://localhost:3001/api/docs |

**Phase 0 verified:** Run health + login checks below when both processes are up.

---

## 3. Environment variables (`apps/web`)

Copy `apps/web/.env.example` → `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

- **`NEXT_PUBLIC_API_BASE_URL`** — API origin only (scheme + host + port). Do **not** include `/api/v1`.
- **`NEXT_PUBLIC_API_URL`** (optional) — Full prefix ending in `/api/v1`; overrides `BASE_URL` when set.

Resolution is implemented in `apps/web/src/lib/api-origin.ts` → `resolveApiV1Prefix()`.

---

## 4. API CORS and cookies

The API enables credentialed CORS for the web origin ([`bootstrap.ts`](../apps/api/src/bootstrap.ts)):

```env
# apps/api/.env (local)
CORS_ALLOWED_ORIGINS="http://localhost:3000"
AUTH_CSRF_TRUSTED_ORIGINS="http://localhost:3000"
AUTH_CSRF_ENFORCED=false
```

| Request | `fetch` credentials | `Authorization` |
|---------|---------------------|-----------------|
| Public (`POST /complaints`, `GET /complaints/track/:ref`) | default / `omit` | None |
| Staff JSON APIs | `omit` | `Bearer <accessToken>` (memory) |
| `POST /auth/login` | `include` | None |
| `POST /auth/refresh`, `POST /auth/logout` | **`include`** | Bearer on logout optional |
| `GET /auth/me` | `omit` | Bearer |

- **Refresh cookie:** `refresh_token` (name from `AUTH_REFRESH_COOKIE_NAME`), set by API on login; path under `/api/v1/auth`.
- **CSRF:** When `AUTH_CSRF_ENFORCED=true`, requests must send a trusted `Origin` (see `AUTH_CSRF_TRUSTED_ORIGINS`).

`lib/api-client.ts` implements: parse `{ data }` / `{ error }`, attach Bearer, **one** refresh attempt on 401 (when a token existed), then redirect to `/[locale]/auth/session-expired`.

---

## 5. Auth seed users (local API)

In `apps/api/.env`:

```env
AUTH_SEED_ENABLED=true
```

Default seed emails (passwords are in **your local** `apps/api/.env` only — do not commit):

| Role | Email |
|------|-------|
| SuperAdmin | `admin@mopd.local` |
| CaseOfficer | `officer@mopd.local` |

E2E default passwords (if env vars unset): see `apps/api/test/e2e/helpers/auth-seed.ts` and [RBAC.md](./RBAC.md) §10.

### Verify login (PowerShell)

Use passwords from your `apps/api/.env`:

```powershell
$loginBody = @{ email = "admin@mopd.local"; password = "<your-admin-password>" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody

$officerBody = @{ email = "officer@mopd.local"; password = "<your-officer-password>" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $officerBody
```

Expect `data.accessToken`, `data.user.roles`, and `data.user.permissions`.

### Verify refresh (curl example)

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mopd.local","password":"<password>"}'

curl -b cookies.txt -X POST http://localhost:3001/api/v1/auth/refresh
```

---

## 6. Design tokens (Phase 0)

MoPD tokens live in `apps/web/src/app/globals.css` (`@theme inline`), aligned with [DESIGN.md](../../CMS%20SRS%20+%20SDS/DESIGN.md) §7–8.

- **Fonts:** Source Sans 3 (Latin), Noto Sans Ethiopic (`--font-ethiopic`) in `layout.tsx`.
- **Dev check:** In development, the home page shows a small token swatch row (`brand-700`, semantic colors, primary button focus ring).

---

## 7. Phase checklist

| Phase 0 task | Done when |
|--------------|-----------|
| 0.1 Monorepo dev | `pnpm dev` serves web :3000 and API `/health` returns 200 |
| 0.2 API URL env | `.env.local` set; `resolveApiV1Prefix()` → `http://localhost:3001/api/v1` |
| 0.3 Auth seed | Login succeeds for admin + officer |
| 0.4 Theme stub | `globals.css` `@theme` + fonts; dev swatches render |
| 0.5 CORS doc | This file §4 |

**Last local verification note:** 2026-05-28 — API `/health` 200; `admin@mopd.local` (SuperAdmin) and `officer@mopd.local` (CaseOfficer) login OK; web `globals.css` tokens + `pnpm --filter @mopd-cms/web build` pass.

```bash
# From mopd-cms/apps/web (passwords from your apps/api/.env)
pnpm verify:phase0 -- -AdminPassword "<admin>" -OfficerPassword "<officer>"
```

---

## 8. Phase 1 status (in progress)

Implemented in `apps/web`:

| Area | Paths |
|------|--------|
| i18n | `src/i18n/*`, `messages/{shared,public,staff}/*`, `src/lib/i18n/load-messages.ts`, `proxy.ts` (Next 16; was `middleware.ts`) |
| API client | `src/lib/api-client.ts`, `src/lib/api-credentials.ts` |
| Auth | `src/components/providers/auth-provider.tsx`, `/[locale]/auth/login` |
| Shells | `PublicShell`, `AuthShell`, `AppShell`, `LocaleSwitcher` |
| Routes | `/en`, `/en/complaints/new`, `/en/complaints/track`, `/en/auth/login`, `/en/dashboard`, `/en/forbidden` (legacy `/en/login`, `/en/submit`, `/en/track`, `/en/app` redirect in `next.config.ts`) |
| E2E | `playwright.config.ts`, `e2e/smoke.spec.ts` |

**Run locally:**

```bash
cd mopd-cms/apps/web
pnpm dev
# open http://localhost:3000/en  (middleware redirects / → /en)
```

**Build:** `pnpm run build` (if TypeScript complains about deleted routes, remove `.next` and rebuild).

**404 on `/en` after route changes:** `pnpm dev` runs `predev`, which clears `.next/dev` so Turbopack does not serve stale routes (e.g. after removing `app/[locale]/(public)/page.tsx`). If 404 persists, stop the dev server and run `pnpm dev:stack` again — do not keep a long-running `next dev` across major App Router moves.

**Next:** Phase 2 staff slice — complaints queue, detail, assign/transition ([roadmap](../../CMS%20SRS%20+%20SDS/MoPD_CMS_Frontend_Implementation_Roadmap.md) Phase 2).
