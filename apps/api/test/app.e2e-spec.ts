import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /api/v1/health returns health envelope', () => {
    return request(app.getHttpServer())
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

    await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-correlation-id', correlationId)
      .expect(200)
      .expect('x-correlation-id', correlationId);
  });

  it('returns standardized not found error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/unknown-resource')
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'not_found',
        message: 'Resource not found',
        correlationId: expect.any(String),
      },
    });
  });

  it('sets secure response headers', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect('x-content-type-options', 'nosniff');
  });

  it('exposes swagger json docs', async () => {
    await request(app.getHttpServer()).get('/api/docs-json').expect(200);
  });

  it('rejects /auth/me without access token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Unauthorized',
        correlationId: expect.any(String),
      },
    });
  });

  it('logs in with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);

    expect(response.body).toEqual({
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          id: expect.any(String),
          email: 'admin@mopd.local',
          roles: ['SuperAdmin'],
        },
      },
    });
  });

  it('returns current user for authenticated token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(meResponse.body).toEqual({
      data: {
        id: expect.any(String),
        email: 'admin@mopd.local',
        roles: ['SuperAdmin'],
      },
    });
  });

  it('refreshes and rotates refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(200);

    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.data.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.data.refreshToken).not.toEqual(
      login.body.data.refreshToken,
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(401);
  });

  it('invalidates refresh token on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(200)
      .expect({
        data: {
          message: 'Logged out successfully',
        },
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(401);
  });

  it('enforces role-based route protection', async () => {
    const officerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/admin/ping')
      .set('Authorization', `Bearer ${officerLogin.body.data.accessToken}`)
      .expect(403);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/admin/ping')
      .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`)
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
