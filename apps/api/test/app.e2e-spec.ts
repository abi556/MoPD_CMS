/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import type { App as SupertestApp } from 'supertest/types';
import type { Server } from 'http';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap';

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

function getBody<T>(response: Response): T {
  const body: unknown = response.body;
  return body as T;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<Server>;

  const httpApp = (): SupertestApp => app.getHttpServer();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp: INestApplication = moduleFixture.createNestApplication();
    configureApp(nestApp);
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
