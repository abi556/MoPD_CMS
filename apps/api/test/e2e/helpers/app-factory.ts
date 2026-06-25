import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { App as SupertestApp } from 'supertest/types';
import type { Server } from 'http';
import { AppModule } from '../../../src/app.module';
import { GlobalHttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { ensureE2eAuthSeedEnv } from './auth-seed';
import { createPrismaMock } from './prisma-mock';

// BullMQ queue provider token — equivalent to getQueueToken('sla-monitor')
const SLA_QUEUE_TOKEN = 'BullQueue_sla-monitor';
const DOCUMENT_SCAN_QUEUE_TOKEN = 'BullQueue_document-scan';
const REPORT_EXPORT_QUEUE_TOKEN = 'BullQueue_report-export';
const mockQueue = {
  add: jest.fn().mockResolvedValue(undefined),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    delayed: 0,
    failed: 0,
  }),
  // RedisHealthService awaits `queue.client` then calls `.ping()` on it
  client: Promise.resolve({
    ping: jest.fn().mockResolvedValue('PONG'),
  }),
};

function applyTestBootstrap(targetApp: INestApplication): void {
  targetApp.setGlobalPrefix('api/v1');
  targetApp.use(helmet());
  targetApp.use(cookieParser());
  targetApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  targetApp.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Swagger is expensive to generate; e2e tests do not assert on docs UI.
  if (process.env.NODE_ENV !== 'test') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MoPD CMS API')
      .setDescription('API-first complaint management platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(
      targetApp,
      swaggerConfig,
    );
    SwaggerModule.setup('api/docs', targetApp, swaggerDocument);
  }
}

export async function createTestApp(): Promise<INestApplication<Server>> {
  ensureE2eAuthSeedEnv();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(createPrismaMock())
    .overrideProvider(SLA_QUEUE_TOKEN)
    .useValue(mockQueue)
    .overrideProvider(DOCUMENT_SCAN_QUEUE_TOKEN)
    .useValue(mockQueue)
    .overrideProvider(REPORT_EXPORT_QUEUE_TOKEN)
    .useValue(mockQueue)
    .compile();

  const nestApp: INestApplication = moduleFixture.createNestApplication();
  applyTestBootstrap(nestApp);
  await nestApp.init();
  return nestApp as INestApplication<Server>;
}

export function asSupertestApp(app: INestApplication<Server>): SupertestApp {
  return app.getHttpServer();
}
