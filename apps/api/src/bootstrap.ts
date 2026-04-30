import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

function getAllowedCorsOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) {
    return ['http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function shouldEnableHsts(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getTrustProxyValue(): boolean | number {
  const raw = process.env.TRUST_PROXY;
  if (!raw) {
    return false;
  }
  if (raw === 'true') {
    return true;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? false : parsed;
}

export function configureApp(app: INestApplication): void {
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const expressApp = httpAdapter.getInstance() as {
      set: (key: string, value: boolean | number) => void;
    };
    expressApp.set('trust proxy', getTrustProxyValue());
  }

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: getAllowedCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  });
  app.use(
    helmet({
      contentSecurityPolicy: true,
      frameguard: { action: 'deny' },
      noSniff: true,
      hsts: shouldEnableHsts()
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }) as RequestHandler,
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('MoPD CMS API')
    .setDescription('API-first complaint management platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    swaggerOptions: {
      withCredentials: true,
    },
  });
}
