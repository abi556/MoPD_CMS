import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { asSupertestApp, createTestApp, getBody } from './helpers/test-context';

describe('Notifications (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('queues password reset email on forgot-password', async () => {
    const response = await request(asSupertestApp(app))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@mopd.local' })
      .expect(200);

    const body = getBody<{ data: { message: string } }>(response);
    expect(body.data.message).toContain('If an active account matches');
  });
});
