import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  ComplaintCreateResponse,
  ComplaintDetailResponse,
  ComplaintHistoryResponse,
  ComplaintListResponse,
  ErrorEnvelope,
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

describe('Complaints Staff (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('rejects complaint list for unauthenticated request', async () => {
    await request(asSupertestApp(app)).get('/api/v1/complaints').expect(401);
  });

  it('lists complaints for staff with pagination and filters', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Road project delay in zone 3',
        description:
          'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
        channel: 'WEB',
        complainantName: 'Abebe Kebede',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);

    await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Delayed fertilizer delivery',
        description:
          'Fertilizer delivery for kebele farmers has been delayed for the current season without notification.',
        channel: 'EMAIL',
        complainantName: 'Meron Tadesse',
        consentGiven: true,
        locale: 'am',
      })
      .expect(201);

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    const response = await request(asSupertestApp(app))
      .get('/api/v1/complaints')
      .query({
        channel: 'WEB',
        locale: 'en',
        page: 1,
        pageSize: 10,
      })
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .expect(200);
    const body = getBody<ComplaintListResponse>(response);
    expect(body.data).toHaveLength(1);
  });

  it('returns complaint details by id for staff users', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Road project delay in zone 3',
        description:
          'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
        channel: 'WEB',
        complainantName: 'Abebe Kebede',
        complainantEmail: 'abebe@example.com',
        complainantPhone: '+251911223344',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    const details = await request(asSupertestApp(app))
      .get(`/api/v1/complaints/${createdBody.data.id}`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .expect(200);
    const detailsBody = getBody<ComplaintDetailResponse>(details);
    expect(detailsBody.data.id).toBe(createdBody.data.id);
  });

  it('returns NOT_FOUND for unknown complaint id on staff detail route', async () => {
    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    const response = await request(asSupertestApp(app))
      .get('/api/v1/complaints/cmp_missing')
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .expect(404);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('assigns complaint to officer and sets status ASSIGNED', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Bridge construction delay',
        description:
          'Bridge construction has halted for several months without public update.',
        channel: 'WEB',
        complainantName: 'Hanna Bekele',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        toStatus: 'TRIAGE',
        reason: 'Initial triage completed by complaints desk.',
      })
      .expect(200);

    const assigned = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/assign`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        assigneeUserId: 'user-officer-0001',
        reason: 'Routing based on transport infrastructure expertise.',
      })
      .expect(200);
    const assignedBody = getBody<ComplaintDetailResponse>(assigned);
    expect(assignedBody.data.status).toBe('ASSIGNED');
  });

  it('transitions complaint from ASSIGNED to IN_INVESTIGATION', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Bridge construction delay',
        description:
          'Bridge construction has halted for several months without public update.',
        channel: 'WEB',
        complainantName: 'Hanna Bekele',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        toStatus: 'TRIAGE',
        reason: 'Initial triage completed by complaints desk.',
      })
      .expect(200);

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/assign`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        assigneeUserId: 'user-officer-0001',
        reason: 'Routing based on transport infrastructure expertise.',
      })
      .expect(200);

    const transitioned = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        toStatus: 'IN_INVESTIGATION',
        reason: 'Field verification started by assigned officer.',
      })
      .expect(200);
    const transitionedBody = getBody<ComplaintDetailResponse>(transitioned);
    expect(transitionedBody.data.status).toBe('IN_INVESTIGATION');
  });

  it('rejects invalid complaint transition with 422', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Bridge construction delay',
        description:
          'Bridge construction has halted for several months without public update.',
        channel: 'WEB',
        complainantName: 'Hanna Bekele',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    const response = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        toStatus: 'CLOSED',
        reason: 'Attempt to skip mandatory state.',
      })
      .expect(422);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns complaint history timeline for staff users', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Bridge construction delay',
        description:
          'Bridge construction has halted for several months without public update.',
        channel: 'WEB',
        complainantName: 'Hanna Bekele',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    const officerLoginBody = getBody<LoginResponse>(officerLogin);

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        toStatus: 'TRIAGE',
        reason: 'Initial triage completed by complaints desk.',
      })
      .expect(200);

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/assign`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        assigneeUserId: 'user-officer-0001',
        reason: 'Routing based on transport infrastructure expertise.',
      })
      .expect(200);

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .send({
        toStatus: 'IN_INVESTIGATION',
        reason: 'Field verification started by assigned officer.',
      })
      .expect(200);

    const response = await request(asSupertestApp(app))
      .get(`/api/v1/complaints/${createdBody.data.id}/history`)
      .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
      .expect(200);
    const body = getBody<ComplaintHistoryResponse>(response);
    expect(body.data).toHaveLength(3);
    expect(body.data[0]?.action).toBe('TRANSITIONED');
    expect(body.data[0]?.toStatus).toBe('TRIAGE');
    expect(body.data[1]?.action).toBe('ASSIGNED');
    expect(body.data[2]?.action).toBe('TRANSITIONED');
    expect(body.data[2]?.toStatus).toBe('IN_INVESTIGATION');
  });

  it('queues complaint_transition when target status is in NOTIFY_TRANSITION_STATUSES', async () => {
    const prev = process.env.NOTIFY_TRANSITION_STATUSES;
    process.env.NOTIFY_TRANSITION_STATUSES = 'TRIAGE';
    try {
      const created = await request(asSupertestApp(app))
        .post('/api/v1/complaints')
        .send({
          subject: 'Bridge construction delay',
          description:
            'Bridge construction has halted for several months without public update.',
          channel: 'WEB',
          complainantName: 'Hanna Bekele',
          complainantEmail: 'hanna@example.com',
          consentGiven: true,
          locale: 'en',
        })
        .expect(201);
      const createdBody = getBody<ComplaintCreateResponse>(created);

      const officerLogin = await request(asSupertestApp(app))
        .post('/api/v1/auth/login')
        .send({
          email: 'officer@mopd.local',
          password: 'OfficerPass123!',
        })
        .expect(200);
      const officerLoginBody = getBody<LoginResponse>(officerLogin);

      await request(asSupertestApp(app))
        .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
        .set('Authorization', `Bearer ${officerLoginBody.data.accessToken}`)
        .send({
          toStatus: 'TRIAGE',
          reason: 'Initial triage completed by complaints desk.',
        })
        .expect(200);

      const adminLogin = await request(asSupertestApp(app))
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@mopd.local',
          password: 'AdminPass123!',
        })
        .expect(200);
      const adminBody = getBody<LoginResponse>(adminLogin);

      const list = await request(asSupertestApp(app))
        .get('/api/v1/notifications')
        .query({ templateKey: 'complaint_transition', pageSize: 50 })
        .set('Authorization', `Bearer ${adminBody.data.accessToken}`)
        .expect(200);

      const envelopes = getBody<{
        data: Array<{ templateKey: string; to: string }>;
      }>(list);
      expect(
        envelopes.data.some(
          (d) =>
            d.templateKey === 'complaint_transition' &&
            d.to === 'hanna@example.com',
        ),
      ).toBe(true);
    } finally {
      process.env.NOTIFY_TRANSITION_STATUSES = prev;
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
