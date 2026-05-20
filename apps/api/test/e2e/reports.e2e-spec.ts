import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  asSupertestApp,
  createTestApp,
  getBody,
  LoginResponse,
} from './helpers/test-context';

describe('Reports (e2e)', () => {
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

  async function seedComplaint(): Promise<void> {
    await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        channel: 'WEB',
        subject: 'Report test complaint',
        description: 'Details for dashboard',
        locale: 'en',
        consentGiven: true,
      })
      .expect(201);
  }

  const range = { from: '2026-01-01', to: '2026-12-31', bucket: 'day' };

  it('returns volume dashboard for super-admin', async () => {
    const token = await loginAdmin();
    await seedComplaint();

    const response = await request(asSupertestApp(app))
      .get('/api/v1/reports/dashboard/volume')
      .query(range)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = getBody<{
      data: { buckets: string[]; series: unknown[]; meta: { total: number } };
    }>(response);
    expect(body.data.buckets.length).toBeGreaterThan(0);
    expect(body.data.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('returns sla dashboard', async () => {
    const token = await loginAdmin();
    const response = await request(asSupertestApp(app))
      .get('/api/v1/reports/dashboard/sla')
      .query(range)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = getBody<{ data: { total: number; onTimePct: number } }>(
      response,
    );
    expect(typeof body.data.onTimePct).toBe('number');
  });

  it('forbids dashboards without report:view', async () => {
    const token = await loginOfficer();
    await request(asSupertestApp(app))
      .get('/api/v1/reports/dashboard/channels')
      .query(range)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('creates export and downloads when ready', async () => {
    const token = await loginAdmin();
    await seedComplaint();

    const created = await request(asSupertestApp(app))
      .post('/api/v1/reports/export')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'csv',
        reportType: 'complaints',
        ...range,
      })
      .expect(201);

    const createdBody = getBody<{
      data: { id: string; status: string };
    }>(created);
    expect(createdBody.data.status).toBe('READY');

    const download = await request(asSupertestApp(app))
      .get(`/api/v1/reports/export/${createdBody.data.id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const downloadBody = getBody<{ data: { url: string; expiresAt: string } }>(
      download,
    );
    expect(downloadBody.data.url.length).toBeGreaterThan(0);
    expect(downloadBody.data.expiresAt.length).toBeGreaterThan(0);
  });

  it('records audit event on export request', async () => {
    const token = await loginAdmin();
    await request(asSupertestApp(app))
      .post('/api/v1/reports/export')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'csv',
        reportType: 'complaints',
        ...range,
      })
      .expect(201);

    const audit = await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .query({ eventType: 'report.export.requested', limit: 5 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const auditBody = getBody<{ data: Array<{ eventType: string }> }>(audit);
    expect(
      auditBody.data.some((e) => e.eventType === 'report.export.requested'),
    ).toBe(true);
  });
});
