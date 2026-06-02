import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const defaultCiDatabaseUrl =
  'postgresql://ci:ci@localhost:5432/ci?schema=public';

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
    ? defaultCiDatabaseUrl
    : undefined);

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for Prisma. Set it in .env locally or in workflow env in CI.',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
