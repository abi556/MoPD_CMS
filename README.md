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

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```
