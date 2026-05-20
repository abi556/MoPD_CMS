# MoPD CMS - API Service

The core backend service for the Ministry of Peace and Development (MoPD) Complaint Management System. Built with [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/), and PostgreSQL.

## 🏗 Architecture & Tech Stack

- **Framework**: NestJS (Node.js / TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma v7 (with `@prisma/adapter-pg`)
- **Caching/Queues**: Redis (planned)
- **API Design**: RESTful, API-First approach
- **Documentation**: Swagger / OpenAPI

## 🚀 Getting Started (Onboarding)

Follow these steps to set up the API service locally.

### 1. Prerequisites

- **Node.js**: v22.0.0 or higher
- **Package Manager**: [pnpm](https://pnpm.io/) v10+
- **Docker**: For running local infrastructure (Postgres, Redis, MinIO)

### 2. Start Local Infrastructure

From the **monorepo root**, start Postgres, Redis, MinIO, ClamAV, and Mailpit:

```bash
cp .env.docker.example .env.docker   # first time only
docker compose -f infra/docker/docker-compose.yml --env-file .env.docker up -d
```

Containers: `mopd-cms-postgres`, `mopd-cms-redis`, `mopd-cms-minio`, `mopd-cms-clamav`, `mopd-cms-mailpit`. MinIO console: http://localhost:9001. ClamAV may take **2+ minutes** on first start.

### 3. Environment Variables

The API requires specific environment variables to connect to the database, object storage, and virus scanning.

```bash
# Inside apps/api
cp .env.example .env
```

When running the API on your **host** (`pnpm start:dev`), keep `MINIO_ENDPOINT=localhost`, `CLAMAV_HOST=localhost` in `.env` (see `.env.example` documents section). See [CMS SRS + SDS/MoPD_CMS_Prod_Environment_Notes.md](../../../CMS%20SRS%20+%20SDS/MoPD_CMS_Prod_Environment_Notes.md) for production differences.

### 4. Install Dependencies

If you haven't already, install dependencies from the monorepo root:

```bash
cd ../../
pnpm install
```

### 5. Database Setup (Prisma)

Initialize/apply the database schema and generate the Prisma Client:

```bash
# Inside apps/api
pnpm prisma:migrate:dev --name init
pnpm prisma:generate
```

For shared/staged environments or when syncing the local DB to committed migrations:

```bash
# From monorepo root
pnpm --filter @mopd-cms/api run prisma:migrate:deploy
pnpm --filter @mopd-cms/api run prisma:generate
```

If auth seed data is enabled in `.env`, seed users/roles/permissions:

```bash
# From monorepo root
pnpm --filter @mopd-cms/api run seed:auth
```

### 6. Run the Server

Start the development server in watch mode:

```bash
# Inside apps/api
pnpm dev
```

The API will be available at `http://localhost:3001/api/v1`.

---

## 📚 API Documentation (Swagger)

Once the server is running, you can access the interactive API documentation at:
👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

This interface allows you to explore endpoints, view request/response schemas, and test the API directly (including JWT authentication).

**All local ports and tools** (Postgres, Redis, MinIO console, Mailpit, Prisma Studio, Bull Board, health URLs): [docs/LOCAL_DEVELOPMENT_URLS.md](../../docs/LOCAL_DEVELOPMENT_URLS.md).

---

## 🧪 Testing

The project follows a Test-Driven Development (TDD) workflow. We maintain unit, integration, and end-to-end (e2e) tests.

```bash
# Run unit tests
pnpm test

# Run e2e tests (requires database)
pnpm test:e2e

# Run tests with coverage report
pnpm test:cov
```

---

## 🛠 Available Scripts

- `pnpm dev` - Start development server (watch mode)
- `pnpm build` - Build the application for production
- `pnpm start:prod` - Run the compiled production build
- `pnpm lint` - Run ESLint to check for code issues
- `pnpm format` - Run Prettier to format code
- `pnpm prisma:generate` - Generate Prisma Client types
- `pnpm prisma:migrate:dev` - Apply database migrations in development
- `pnpm prisma:migrate:deploy` - Apply committed migrations (non-interactive)
- `pnpm seed:auth` - Seed auth roles/users/permissions from environment
- `pnpm security:check` - Validate security-critical env configuration (enforces strict checks when `NODE_ENV=production`)

---

## 🔐 Security & Authentication

- **JWT**: Endpoints are protected using short-lived Access Tokens (15m) and rotating Refresh Tokens (7d).
- **RBAC**: Role-Based Access Control is enforced via the `@Roles()` decorator.
- **Rate Limiting**: Global rate limiting is applied to prevent abuse.
- **Helmet**: Explicit security headers are enabled (CSP, frameguard, nosniff, HSTS in production, referrer policy).
- **CORS**: Credentialed CORS is restricted to trusted origins via `CORS_ALLOWED_ORIGINS`.
- **CSRF protection for cookie-auth routes**: `/auth/refresh` and `/auth/logout` enforce trusted `Origin`/`Referer` checks when `AUTH_CSRF_ENFORCED=true` (default on production).
- **Proxy-aware security**: `TRUST_PROXY` is supported for deployments behind reverse proxies/load balancers.

### Tiered rate limits (route/actor)

- **Global baseline**: 300 requests/minute.
- **Public endpoints**:
  - `POST /complaints`: 30/min (IP-based when unauthenticated)
  - `GET /complaints/track/:referenceNo`: 60/min (IP-based when unauthenticated)
- **Authentication endpoints**:
  - `POST /auth/login`: 10/min
  - `POST /auth/refresh`: 30/min
  - `POST /auth/logout`: 30/min
- **Staff/Admin endpoints**:
  - Complaint staff reads: 180/min
  - Complaint workflow writes: 120/min
  - Admin ping: 120/min

Rate-limit keying is actor-aware:

- authenticated requests -> user-id based
- unauthenticated requests -> IP based

## ✅ Production Security Checklist

Before deploying to production, verify all of the following:

- Set `NODE_ENV=production`.
- Set `TRUST_PROXY=true` (or the correct hop count) when behind Nginx/ALB/Cloudflare/etc.
- Restrict `CORS_ALLOWED_ORIGINS` to exact frontend origin(s), no wildcards.
- Use strong unique secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (at least 64 random characters).
- Set `AUTH_COOKIE_SECURE=true` (HTTPS-only cookie transport).
- Set `AUTH_CSRF_ENFORCED=true` and configure `AUTH_CSRF_TRUSTED_ORIGINS` with exact trusted UI origin(s).
- Terminate TLS at edge/proxy and redirect all HTTP traffic to HTTPS.
- Keep DB/Redis/MinIO credentials in secret manager or environment only (never committed files).
- Run migrations in deployment pipeline with `pnpm --filter @mopd-cms/api run prisma:migrate:deploy`.
- Keep `AUTH_SEED_ENABLED=false` in production after initial bootstrap.

### Recommended production example

```env
NODE_ENV=production
TRUST_PROXY=true
CORS_ALLOWED_ORIGINS="https://cms.mopd.gov.et"

AUTH_COOKIE_SECURE=true
AUTH_CSRF_ENFORCED=true
AUTH_CSRF_TRUSTED_ORIGINS="https://cms.mopd.gov.et"
```

### CI guard (recommended)

Run this in deployment/CI before startup:

```bash
pnpm --filter @mopd-cms/api run security:check
```

_Note: This README will be continuously updated as new infrastructure (like Redis queues or MinIO storage) is fully integrated into the application logic._
