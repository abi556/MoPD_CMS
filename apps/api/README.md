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
From the root of the monorepo, start the required databases using Docker Compose:
```bash
cd ../../infra/docker
docker compose up -d
```

### 3. Environment Variables
The API requires specific environment variables to connect to the database and sign tokens.
```bash
# Inside apps/api
cp .env.example .env
```
*(The default values in `.env.example` are pre-configured to work with the local Docker Compose setup).*

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

---

## 🔐 Security & Authentication

- **JWT**: Endpoints are protected using short-lived Access Tokens (15m) and rotating Refresh Tokens (7d).
- **RBAC**: Role-Based Access Control is enforced via the `@Roles()` decorator.
- **Rate Limiting**: Global rate limiting is applied to prevent abuse.
- **Helmet**: HTTP headers are secured using Helmet.

*Note: This README will be continuously updated as new infrastructure (like Redis queues or MinIO storage) is fully integrated into the application logic.*
