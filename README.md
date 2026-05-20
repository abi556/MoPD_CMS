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

2. Run both API and web:

```bash
pnpm dev
```

3. API health check:

`GET http://localhost:3001/api/v1/health`

## Local infrastructure

Copy Docker env and start Postgres, Redis, MinIO, ClamAV, and Mailpit:

```bash
cp .env.docker.example .env.docker
docker compose -f infra/docker/docker-compose.yml --env-file .env.docker up -d
```

Containers: `mopd-cms-postgres`, `mopd-cms-redis`, `mopd-cms-minio`, `mopd-cms-clamav`, `mopd-cms-mailpit`. ClamAV first start may take 2+ minutes.

**Local URLs (Swagger, Mailpit, MinIO, Postgres, Redis, Prisma Studio, Bull Board):** see [docs/LOCAL_DEVELOPMENT_URLS.md](docs/LOCAL_DEVELOPMENT_URLS.md).

Ensure [apps/api/.env](apps/api/.env) includes MinIO/ClamAV settings (see [apps/api/.env.example](apps/api/.env.example)) when running the API on the host with `pnpm dev`.
