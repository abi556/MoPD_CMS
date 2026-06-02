# MoPD CMS Monorepo

API-first monorepo bootstrap for the MoPD Complaint Management System.

## Workspace layout

- `apps/api` - NestJS API (`/api/v1/*`)
- `apps/web` - Next.js frontend
- `packages/shared` - shared TypeScript types/enums/interfaces
- `infra/docker/docker-compose.yml` - local infrastructure

## Quick start

1. Install dependencies:

```bash
pnpm install
```

2. Copy env files (first time):

```bash
cp .env.docker.example .env.docker
cp apps/api/.env.example apps/api/.env
```

3. Start backing services and run API + web on your machine (**recommended daily dev**):

```bash
pnpm dev:stack
```

Or run infra and apps separately:

```bash
pnpm docker:infra   # Postgres, Redis, MinIO, ClamAV, Mailpit
pnpm dev            # Nest API + Next.js with hot reload
```

4. API health check:

`GET http://localhost:3001/api/v1/health`

Apply database migrations when needed (from repo root):

```bash
pnpm --filter @mopd-cms/api prisma:migrate:deploy
```

Optional seed users: `pnpm --filter @mopd-cms/api run seed:auth`

## Docker: two modes

| Mode | Command | What runs |
|------|---------|-----------|
| **Daily dev** (default) | `pnpm dev:stack` or `pnpm docker:infra` + `pnpm dev` | Infra in Docker; API + web on host (ports 3001 / 3000) |
| **Full container stack** | `pnpm docker:app` | Infra + API + web **inside** Docker (`--profile app`) |

**Do not** run `pnpm docker:app` and `pnpm dev` at the same time — both bind ports 3000 and 3001.

Production images build from the **monorepo root** (see `apps/api/Dockerfile`, `apps/web/Dockerfile`). Root [`.dockerignore`](.dockerignore) keeps build contexts small.

```bash
# Infra only
pnpm docker:infra

# Stop infra
pnpm docker:infra:down

# Full stack in containers (build + start)
pnpm docker:app
```

Containers (infra): `mopd-cms-postgres`, `mopd-cms-redis`, `mopd-cms-minio`, `mopd-cms-clamav`, `mopd-cms-mailpit`. ClamAV first start may take 2+ minutes.

Ensure [apps/api/.env](apps/api/.env) uses **host** endpoints when using daily dev (`localhost` for Postgres on port `5433`, MinIO, ClamAV — see [apps/api/.env.example](apps/api/.env.example)). Docker Compose sets **service names** (`postgres`, `minio`, …) only for the `app` profile containers.
