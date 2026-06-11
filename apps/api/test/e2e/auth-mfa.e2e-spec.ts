import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import type { LoginResponse } from './helpers/types';
import {
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

describe('Auth MFA Enrollment (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  async function loginAdmin(): Promise<string> {
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'admin@mopd.local', password: 'AdminPass123!' })
      .expect(200);
    const body = getBody<LoginResponse>(res);
    return body.data.accessToken!;
  }

  it('returns MFA enrollment data (QR + backup codes)', async () => {
    const token = await loginAdmin();
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as {
      data: {
        qrCodeDataUrl: string;
        secret: string;
        backupCodes: string[];
      };
    };
    expect(body.data.qrCodeDataUrl).toContain('data:image/png');
    expect(typeof body.data.secret).toBe('string');
    expect(body.data.backupCodes).toHaveLength(10);
  });

  it('rejects mfa/confirm with wrong code', async () => {
    const token = await loginAdmin();
    await request(asSupertestApp(app))
      .post('/api/v1/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(asSupertestApp(app))
      .post('/api/v1/auth/mfa/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' })
      .expect(422);
  });

  it('rejects mfa/enroll without auth', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/auth/mfa/enroll')
      .expect(401);
  });

  it('returns MFA status for authenticated user', async () => {
    const token = await loginAdmin();
    const res = await request(asSupertestApp(app))
      .get('/api/v1/auth/mfa/status')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as {
      data: { enrolled: boolean; provider: string; policy: string };
    };
    expect(typeof body.data.enrolled).toBe('boolean');
    expect(body.data.provider).toBe('totp');
  });
});
