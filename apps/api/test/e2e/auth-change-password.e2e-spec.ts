import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import type { LoginResponse, ErrorEnvelope } from './helpers/types';
import { asSupertestApp, createTestApp, getBody } from './helpers/test-context';

describe('Auth Change-Password (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app?.close();
  });

  async function loginAdmin(): Promise<string> {
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'admin@mopd.local', password: 'AdminPass123!' })
      .expect(200);
    const body = getBody<LoginResponse>(res);
    return body.data.accessToken!;
  }

  it('rejects change-password without auth', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/auth/change-password')
      .send({
        currentPassword: 'AdminPass123!',
        newPassword: 'NewStrongPass456!',
      })
      .expect(401);
  });

  it('rejects when current password is wrong', async () => {
    const token = await loginAdmin();
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPass000!',
        newPassword: 'NewStrongPass456!',
      })
      .expect(401);
    const body = getBody<ErrorEnvelope>(res);
    expect(body.error.message).toContain('incorrect');
  });

  it('rejects when new password is same as current', async () => {
    const token = await loginAdmin();
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'AdminPass123!', newPassword: 'AdminPass123!' })
      .expect(422);
    const body = getBody<ErrorEnvelope>(res);
    expect(body.error.message).toContain('differ');
  });

  it('rejects weak new password', async () => {
    const token = await loginAdmin();
    await request(asSupertestApp(app))
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'AdminPass123!', newPassword: 'weakpassword' })
      .expect(422);
  });

  it('successfully changes password', async () => {
    const token = await loginAdmin();
    await request(asSupertestApp(app))
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'AdminPass123!',
        newPassword: 'BrandNewPass456!',
      })
      .expect(200);
  });

  it('login response includes mustChangePassword flag', async () => {
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'admin@mopd.local', password: 'AdminPass123!' })
      .expect(200);
    const body = getBody<LoginResponse>(res);
    expect(typeof body.data.mustChangePassword).toBe('boolean');
    expect(typeof body.data.mfaRequired).toBe('boolean');
  });
});
