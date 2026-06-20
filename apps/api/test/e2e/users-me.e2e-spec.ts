import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { loginAsRole } from './helpers/login-as-role';
import { asSupertestApp, createTestApp } from './helpers/test-context';

describe('Users profile (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('PATCH /users/me updates preferred locale', async () => {
    const token = await loginAsRole(asSupertestApp(app), 'CaseOfficer');
    const res = await request(asSupertestApp(app))
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferredLocale: 'am' })
      .expect(200);

    expect(res.body.data.preferredLocale).toBe('am');
  });

  it('PATCH /users/me rejects invalid locale', async () => {
    const token = await loginAsRole(asSupertestApp(app), 'CaseOfficer');
    await request(asSupertestApp(app))
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferredLocale: 'fr' })
      .expect(422);
  });

  it('GET /auth/me returns preferredLocale after update', async () => {
    const token = await loginAsRole(asSupertestApp(app), 'CaseOfficer');
    await request(asSupertestApp(app))
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferredLocale: 'en' })
      .expect(200);

    const me = await request(asSupertestApp(app))
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.data.preferredLocale).toBe('en');
  });
});
