import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

/**
 * Regression guard: collaboration routes must live under /complaints/:id/*
 * (POST :id/tasks without "complaints/" prefix broke task creation — 404).
 */
describe('Case collaboration route contract (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('does not register POST /api/v1/:id/tasks', async () => {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const token = getBody<LoginResponse>(login).data.accessToken;

    await request(asSupertestApp(app))
      .post('/api/v1/cmp_1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Wrong path',
        assigneeUserId: 'user-officer-0001',
      })
      .expect(404);
  });
});
