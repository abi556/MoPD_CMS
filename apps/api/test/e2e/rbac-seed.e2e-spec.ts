import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { E2E_ROLE_CREDENTIALS, loginAsRole } from './helpers/login-as-role';
import { asSupertestApp, createTestApp } from './helpers/test-context';

describe('RBAC seed (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it.each(
    Object.keys(E2E_ROLE_CREDENTIALS) as Array<
      keyof typeof E2E_ROLE_CREDENTIALS
    >,
  )('logs in seeded role %s', async (role) => {
    const token = await loginAsRole(asSupertestApp(app), role);
    expect(token).toEqual(expect.any(String));
  });

  it('allows auditor to read audit logs but not manage users', async () => {
    const token = await loginAsRole(asSupertestApp(app), 'Auditor');
    await request(asSupertestApp(app))
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(asSupertestApp(app))
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows system admin to manage users without super admin role name', async () => {
    const token = await loginAsRole(asSupertestApp(app), 'SystemAdmin');
    await request(asSupertestApp(app))
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
