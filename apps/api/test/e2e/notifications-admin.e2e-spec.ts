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
import { loginAsRole } from './helpers/login-as-role';

describe('Notifications admin (e2e)', () => {
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

  it('lists notification deliveries for super-admin', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@mopd.local' })
      .expect(200);

    const token = await loginAdmin();
    const list = await request(asSupertestApp(app))
      .get('/api/v1/notifications')
      .query({ pageSize: 20 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = getBody<{
      data: Array<{ id: string; templateKey: string }>;
      meta: { total: number };
    }>(list);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((r) => r.templateKey === 'password_reset')).toBe(
      true,
    );
  });

  it('lists notification templates for communications officer', async () => {
    const token = await loginAsRole(
      asSupertestApp(app),
      'CommunicationsOfficer',
    );
    await request(asSupertestApp(app))
      .get('/api/v1/notification-templates')
      .query({ pageSize: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('returns 403 for notifications list when officer lacks config:manage', async () => {
    const officerToken = await loginOfficer();
    const response = await request(asSupertestApp(app))
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${officerToken}`)
      .expect(403);
    const err = getBody<ErrorEnvelope>(response);
    expect(err.error.code).toBe('FORBIDDEN');
  });

  it('resends a sent delivery as a new queued row', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@mopd.local' })
      .expect(200);

    const token = await loginAdmin();
    const list = await request(asSupertestApp(app))
      .get('/api/v1/notifications')
      .query({ templateKey: 'password_reset' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const listBody = getBody<{
      data: Array<{ id: string; status: string }>;
    }>(list);
    const prior = listBody.data.find((d) => d.status === 'sent');
    expect(prior).toBeDefined();

    const resend = await request(asSupertestApp(app))
      .post(`/api/v1/notifications/${prior!.id}/resend`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const resendBody = getBody<{ data: { newDeliveryId: string } }>(resend);
    expect(resendBody.data.newDeliveryId).toBeDefined();
    expect(resendBody.data.newDeliveryId).not.toBe(prior!.id);
  });

  it('lists and patches notification templates', async () => {
    const token = await loginAdmin();
    const list = await request(asSupertestApp(app))
      .get('/api/v1/notification-templates')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const listBody = getBody<{
      data: Array<{ id: string; key: string; subject: string }>;
    }>(list);
    expect(listBody.data.length).toBeGreaterThan(0);
    const passwordRow = listBody.data.find((t) => t.key === 'password_reset');
    expect(passwordRow).toBeDefined();

    const patch = await request(asSupertestApp(app))
      .patch(`/api/v1/notification-templates/${passwordRow!.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Reset your MoPD CMS password (updated)' })
      .expect(200);
    const patchBody = getBody<{ data: { subject: string } }>(patch);
    expect(patchBody.data.subject).toBe(
      'Reset your MoPD CMS password (updated)',
    );
  });

  it('creates a custom template', async () => {
    const token = await loginAdmin();
    const created = await request(asSupertestApp(app))
      .post('/api/v1/notification-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'e2e_custom_ping',
        locale: 'en',
        channel: 'email',
        subject: 'Hello {{name}}',
        bodyHtml: '<p>Hi {{name}}</p>',
        bodyText: 'Hi {{name}}',
      })
      .expect(201);

    const body = getBody<{ data: { id: string; key: string } }>(created);
    expect(body.data.key).toBe('e2e_custom_ping');
  });
});
