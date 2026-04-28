/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import request from 'supertest';
import type { Response } from 'supertest';
import type { App as SupertestApp } from 'supertest/types';
import type { Server } from 'http';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    correlationId: string;
  };
}

interface AuthUserResponse {
  id: string;
  email: string;
  roles: string[];
}

interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: AuthUserResponse;
  };
}

interface TokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
  };
}

interface ComplaintCreateResponse {
  data: {
    id: string;
    referenceNo: string;
    status: 'SUBMITTED';
    channel: 'WEB' | 'ASSISTED' | 'EMAIL' | 'SMS' | 'USSD';
    subject: string;
    submittedAt: string;
    locale: 'en' | 'am';
    consentGiven: boolean;
  };
}

interface ComplaintTrackResponse {
  data: {
    referenceNo: string;
    status: 'SUBMITTED';
    subject: string;
    submittedAt: string;
  };
}

interface StoredComplaint {
  id: string;
  sequenceNo: number;
  referenceNo: string;
  status: 'SUBMITTED';
  channel: 'WEB' | 'ASSISTED' | 'EMAIL' | 'SMS' | 'USSD';
  subject: string;
  description: string;
  submittedAt: Date;
  locale: 'en' | 'am';
  consentGiven: boolean;
  complainantName: string | null;
  complainantEmail: string | null;
  complainantPhone: string | null;
}

function getBody<T>(response: Response): T {
  const body: unknown = response.body;
  return body as T;
}

function createPrismaMock(): PrismaService {
  const store = new Map<string, StoredComplaint>();
  let sequence = 0;

  const create = (args: {
    data: Omit<StoredComplaint, 'id' | 'sequenceNo' | 'submittedAt'>;
  }): StoredComplaint => {
    sequence += 1;
    const now = new Date();
    const created: StoredComplaint = {
      id: `cmp_${sequence}`,
      sequenceNo: sequence,
      referenceNo: args.data.referenceNo,
      status: args.data.status,
      channel: args.data.channel,
      subject: args.data.subject,
      description: args.data.description,
      submittedAt: now,
      locale: args.data.locale,
      consentGiven: args.data.consentGiven,
      complainantName: args.data.complainantName,
      complainantEmail: args.data.complainantEmail,
      complainantPhone: args.data.complainantPhone,
    };
    store.set(created.id, created);
    return created;
  };

  const update = (args: {
    where: { id: string };
    data: { referenceNo: string };
  }): StoredComplaint => {
    const found = store.get(args.where.id);
    if (!found) {
      throw new Error('record not found');
    }
    const updated: StoredComplaint = {
      ...found,
      referenceNo: args.data.referenceNo,
    };
    store.set(updated.id, updated);
    return updated;
  };

  const findUnique = (args: {
    where: { referenceNo: string };
  }): StoredComplaint | null => {
    for (const value of store.values()) {
      if (value.referenceNo === args.where.referenceNo) {
        return value;
      }
    }
    return null;
  };

  const prismaLike = {
    complaint: {
      findUnique,
    },
    $transaction: async <T>(
      callback: (tx: {
        complaint: { create: typeof create; update: typeof update };
      }) => Promise<T>,
    ): Promise<T> => {
      return callback({
        complaint: {
          create,
          update,
        },
      });
    },
  };

  return prismaLike as unknown as PrismaService;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<Server>;

  const httpApp = (): SupertestApp => app.getHttpServer();
  const applyTestBootstrap = (targetApp: INestApplication): void => {
    targetApp.setGlobalPrefix('api/v1');
    targetApp.use(helmet());
    targetApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    targetApp.useGlobalFilters(new GlobalHttpExceptionFilter());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('MoPD CMS API')
      .setDescription('API-first complaint management platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(
      targetApp,
      swaggerConfig,
    );
    SwaggerModule.setup('api/docs', targetApp, swaggerDocument);
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    const nestApp: INestApplication = moduleFixture.createNestApplication();
    applyTestBootstrap(nestApp);
    await nestApp.init();
    app = nestApp as INestApplication<Server>;
  });

  it('GET /api/v1/health returns health envelope', () => {
    return request(httpApp())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        data: {
          status: 'ok',
          service: 'mopd-cms-api',
        },
      });
  });

  it('propagates correlation id header', async () => {
    const correlationId = 'test-correlation-id-123';

    await request(httpApp())
      .get('/api/v1/health')
      .set('x-correlation-id', correlationId)
      .expect(200)
      .expect('x-correlation-id', correlationId);
  });

  it('returns standardized not found error envelope', async () => {
    const response = await request(httpApp())
      .get('/api/v1/unknown-resource')
      .expect(404);

    const body = getBody<ErrorEnvelope>(response);

    expect(body.error.code).toBe('not_found');
    expect(body.error.message).toBe('Resource not found');
    expect(typeof body.error.correlationId).toBe('string');
  });

  it('sets secure response headers', async () => {
    await request(httpApp())
      .get('/api/v1/health')
      .expect(200)
      .expect('x-content-type-options', 'nosniff');
  });

  it('exposes swagger json docs', async () => {
    await request(httpApp()).get('/api/docs-json').expect(200);
  });

  it('creates complaint and returns tracking reference', async () => {
    const response = await request(httpApp())
      .post('/api/v1/complaints')
      .send({
        subject: 'Road project delay in zone 3',
        description:
          'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
        channel: 'WEB',
        complainantName: 'Abebe Kebede',
        complainantEmail: 'abebe@example.com',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);

    const body = getBody<ComplaintCreateResponse>(response);

    expect(typeof body.data.id).toBe('string');
    expect(body.data.referenceNo).toMatch(/^CMS-\d{4}-\d{6}$/);
    expect(body.data.status).toBe('SUBMITTED');
    expect(body.data.channel).toBe('WEB');
    expect(body.data.subject).toBe('Road project delay in zone 3');
    expect(body.data.locale).toBe('en');
    expect(body.data.consentGiven).toBe(true);
    expect(typeof body.data.submittedAt).toBe('string');
  });

  it('tracks complaint by reference number', async () => {
    const created = await request(httpApp())
      .post('/api/v1/complaints')
      .send({
        subject: 'Delayed fertilizer delivery',
        description:
          'Fertilizer delivery for kebele farmers has been delayed for the current season without notification.',
        channel: 'WEB',
        complainantName: 'Meron Tadesse',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const tracked = await request(httpApp())
      .get(`/api/v1/complaints/track/${createdBody.data.referenceNo}`)
      .expect(200);
    const trackedBody = getBody<ComplaintTrackResponse>(tracked);

    expect(trackedBody.data.referenceNo).toBe(createdBody.data.referenceNo);
    expect(trackedBody.data.status).toBe('SUBMITTED');
    expect(trackedBody.data.subject).toBe('Delayed fertilizer delivery');
    expect(typeof trackedBody.data.submittedAt).toBe('string');
  });

  it('rejects complaint submission without consent', async () => {
    const response = await request(httpApp())
      .post('/api/v1/complaints')
      .send({
        subject: 'Electricity outage',
        description:
          'Neighborhood has had repeated outages for over two weeks and no response from local office.',
        channel: 'WEB',
        consentGiven: false,
        locale: 'en',
      })
      .expect(422);
    const body = getBody<ErrorEnvelope>(response);

    expect(body.error.code).toBe('validation_error');
  });

  it('returns not_found for unknown complaint reference', async () => {
    const response = await request(httpApp())
      .get('/api/v1/complaints/track/CMS-2099-999999')
      .expect(404);
    const body = getBody<ErrorEnvelope>(response);

    expect(body.error.code).toBe('not_found');
    expect(body.error.message).toBe('Resource not found');
  });

  it('rejects /auth/me without access token', async () => {
    const response = await request(httpApp())
      .get('/api/v1/auth/me')
      .expect(401);

    const body = getBody<ErrorEnvelope>(response);

    expect(body.error.code).toBe('unauthorized');
    expect(body.error.message).toBe('Unauthorized');
    expect(typeof body.error.correlationId).toBe('string');
  });

  it('logs in with valid credentials', async () => {
    const response = await request(httpApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);

    const body = getBody<LoginResponse>(response);

    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');
    expect(body.data.tokenType).toBe('Bearer');
    expect(body.data.expiresIn).toBe(900);
    expect(typeof body.data.user.id).toBe('string');
    expect(body.data.user.email).toBe('admin@mopd.local');
    expect(body.data.user.roles).toEqual(['SuperAdmin']);
  });

  it('returns current user for authenticated token', async () => {
    const login = await request(httpApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const loginBody = getBody<LoginResponse>(login);

    const meResponse = await request(httpApp())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(200);
    const meBody = getBody<{ data: AuthUserResponse }>(meResponse);

    expect(typeof meBody.data.id).toBe('string');
    expect(meBody.data.email).toBe('admin@mopd.local');
    expect(meBody.data.roles).toEqual(['SuperAdmin']);
  });

  it('refreshes and rotates refresh token', async () => {
    const login = await request(httpApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const loginBody = getBody<LoginResponse>(login);

    const refreshResponse = await request(httpApp())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginBody.data.refreshToken })
      .expect(200);
    const refreshBody = getBody<TokenResponse>(refreshResponse);

    expect(refreshBody.data.accessToken).toEqual(expect.any(String));
    expect(refreshBody.data.refreshToken).toEqual(expect.any(String));
    expect(refreshBody.data.refreshToken).not.toEqual(
      loginBody.data.refreshToken,
    );

    await request(httpApp())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginBody.data.refreshToken })
      .expect(401);
  });

  it('invalidates refresh token on logout', async () => {
    const login = await request(httpApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const loginBody = getBody<LoginResponse>(login);

    await request(httpApp())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .send({ refreshToken: loginBody.data.refreshToken })
      .expect(200)
      .expect({
        data: {
          message: 'Logged out successfully',
        },
      });

    await request(httpApp())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginBody.data.refreshToken })
      .expect(401);
  });

  it('enforces role-based route protection', async () => {
    const officerLogin = await request(httpApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    await request(httpApp())
      .get('/api/v1/admin/ping')
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .expect(403);

    const adminLogin = await request(httpApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const adminLoginBody = getBody<LoginResponse>(adminLogin);

    await request(httpApp())
      .get('/api/v1/admin/ping')
      .set('Authorization', `Bearer ${adminLoginBody.data.accessToken}`)
      .expect(200)
      .expect({
        data: {
          status: 'admin-ok',
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
