import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  ErrorEnvelope,
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

describe('Audit logs (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  async function loginAdmin(): Promise<string> {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    return getBody<LoginResponse>(login).data.accessToken;
  }

  async function loginOfficer(): Promise<string> {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    return getBody<LoginResponse>(login).data.accessToken;
  }

  it('lists audit logs for super-admin', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@mopd.local' })
      .expect(200);

    const token = await loginAdmin();
    const list = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .query({ limit: 20 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = getBody<{
      data: Array<{ id: string; eventType: string }>;
      meta: { hasNext: boolean; nextCursor: string | null };
    }>(list);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      body.data.some((row) => row.eventType === 'auth.login.succeeded'),
    ).toBe(true);
    expect(typeof body.meta.hasNext).toBe('boolean');
  });

  it('returns 403 for audit list when officer lacks audit:read', async () => {
    const officerToken = await loginOfficer();
    const response = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${officerToken}`)
      .expect(403);
    const err = getBody<ErrorEnvelope>(response);
    expect(err.error.code).toBe('FORBIDDEN');
  });

  it('filters audit logs by eventType', async () => {
    const token = await loginAdmin();
    const list = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .query({ eventType: 'auth.login.succeeded', limit: 50 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = getBody<{
      data: Array<{ eventType: string }>;
    }>(list);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      body.data.every((row) => row.eventType === 'auth.login.succeeded'),
    ).toBe(true);
  });

  it('paginates with cursor without duplicates', async () => {
    const token = await loginAdmin();
    await request(asSupertestApp(app))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@mopd.local' })
      .expect(200);
    await request(asSupertestApp(app))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'officer@mopd.local' })
      .expect(200);

    const first = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .query({ limit: 2 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const firstBody = getBody<{
      data: Array<{ id: string }>;
      meta: { hasNext: boolean; nextCursor: string | null };
    }>(first);
    expect(firstBody.data).toHaveLength(2);

    if (!firstBody.meta.hasNext || !firstBody.meta.nextCursor) {
      return;
    }

    const second = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .query({ limit: 2, cursor: firstBody.meta.nextCursor })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const secondBody = getBody<{ data: Array<{ id: string }> }>(second);
    const firstIds = new Set(firstBody.data.map((row) => row.id));
    for (const row of secondBody.data) {
      expect(firstIds.has(row.id)).toBe(false);
    }
  });

  it('exports audit logs as CSV', async () => {
    const token = await loginAdmin();
    const response = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs/export')
      .query({ eventType: 'auth.login.succeeded', limit: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.headers['content-disposition']).toMatch(/attachment/);
    const text = response.text;
    expect(text).toContain('id,eventType,actorUserId');
    expect(text).toContain('auth.login.succeeded');
  });
});
