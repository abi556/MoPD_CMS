import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  AuthUserResponse,
  ErrorEnvelope,
  LoginResponse,
  TokenResponse,
  asSupertestApp,
  createTestApp,
  getBody,
  getRefreshCookieHeader,
} from './helpers/test-context';

describe('Auth/Admin (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('rejects /auth/me without access token', async () => {
    const response = await request(asSupertestApp(app))
      .get('/api/v1/auth/me')
      .expect(401);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('logs in with valid credentials', async () => {
    const response = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const body = getBody<LoginResponse>(response);
    const refreshCookieHeader = getRefreshCookieHeader(response);

    expect(typeof body.data.accessToken).toBe('string');
    expect(body.data.user.email).toBe('admin@mopd.local');
    expect(body.data.user.permissions).toContain('admin:ping');
    expect(refreshCookieHeader).toContain('refresh_token=');
  });

  it('returns current user for authenticated token', async () => {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const loginBody = getBody<LoginResponse>(login);

    const meResponse = await request(asSupertestApp(app))
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(200);
    const meBody = getBody<{ data: AuthUserResponse }>(meResponse);
    expect(meBody.data.roles).toEqual(['SuperAdmin']);
  });

  it('refreshes and rotates refresh token', async () => {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const loginRefreshCookie = getRefreshCookieHeader(login);

    const refreshResponse = await request(asSupertestApp(app))
      .post('/api/v1/auth/refresh')
      .set('Cookie', loginRefreshCookie)
      .expect(200);
    const refreshBody = getBody<TokenResponse>(refreshResponse);
    const rotatedRefreshCookie = getRefreshCookieHeader(refreshResponse);

    expect(refreshBody.data.accessToken).toEqual(expect.any(String));
    expect(rotatedRefreshCookie).toContain('refresh_token=');
    expect(rotatedRefreshCookie).not.toEqual(loginRefreshCookie);

    await request(asSupertestApp(app))
      .post('/api/v1/auth/refresh')
      .set('Cookie', loginRefreshCookie)
      .expect(401);
  });

  it('invalidates refresh token on logout and revokes access token', async () => {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const loginBody = getBody<LoginResponse>(login);
    const loginRefreshCookie = getRefreshCookieHeader(login);

    await request(asSupertestApp(app))
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .set('Cookie', loginRefreshCookie)
      .expect(200);

    await request(asSupertestApp(app))
      .post('/api/v1/auth/refresh')
      .set('Cookie', loginRefreshCookie)
      .expect(401);

    await request(asSupertestApp(app))
      .get('/api/v1/admin/ping')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(401);
  });

  it('enforces role-based route protection', async () => {
    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    await request(asSupertestApp(app))
      .get('/api/v1/admin/ping')
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .expect(403);

    const adminLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const adminLoginBody = getBody<LoginResponse>(adminLogin);

    await request(asSupertestApp(app))
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
