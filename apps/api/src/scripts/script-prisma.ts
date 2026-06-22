import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be configured in production');
  }

  return 'postgresql://cms:password@localhost:5432/cms';
}

/** Prisma 7 requires a driver adapter — same setup as PrismaService. */
export function createScriptPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
}
