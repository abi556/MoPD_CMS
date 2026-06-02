import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  ComplaintCreateResponse,
  ComplaintTrackResponse,
  ErrorEnvelope,
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

describe('Platform/Public (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('GET /api/v1/health returns health envelope', () => {
    return request(asSupertestApp(app))
      .get('/api/v1/health')
      .expect(200)
      .expect({
        data: {
          status: 'ok',
          service: 'mopd-cms-api',
        },
      });
  });

  it('propagates correlation id header', async () => {
    const correlationId = 'test-correlation-id-123';
    await request(asSupertestApp(app))
      .get('/api/v1/health')
      .set('x-correlation-id', correlationId)
      .expect(200)
      .expect('x-correlation-id', correlationId);
  });

  it('returns standardized not found error envelope', async () => {
    const response = await request(asSupertestApp(app))
      .get('/api/v1/unknown-resource')
      .expect(404);
    const body = getBody<ErrorEnvelope>(response);

    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Resource not found');
    expect(typeof body.error.correlationId).toBe('string');
  });

  it('sets secure response headers', async () => {
    await request(asSupertestApp(app))
      .get('/api/v1/health')
      .expect(200)
      .expect('x-content-type-options', 'nosniff');
  });

  it('exposes swagger json docs', async () => {
    await request(asSupertestApp(app)).get('/api/docs-json').expect(200);
  });

  it('creates complaint and returns tracking reference', async () => {
    const response = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Road project delay in zone 3',
        description:
          'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
        channel: 'WEB',
        complainantName: 'Abebe Kebede',
        complainantEmail: 'abebe@example.com',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const body = getBody<ComplaintCreateResponse>(response);

    expect(typeof body.data.id).toBe('string');
    expect(body.data.referenceNo).toMatch(/^CMS-\d{4}-\d{6}$/);
    expect(body.data.status).toBe('SUBMITTED');
  });

  it('returns upload session when requestUploadSession=true', async () => {
    const response = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Public intake with optional evidence',
        description:
          'Citizen submits complaint and requests upload session for optional evidence.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
        requestUploadSession: true,
      })
      .expect(201);
    const body = getBody<ComplaintCreateResponse>(response);

    expect(body.data.uploadSession).toBeDefined();
    expect(typeof body.data.uploadSession?.token).toBe('string');
    expect(body.data.uploadSession?.complaintId).toBe(body.data.id);
  });

  it('uploads optional evidence through public tokenized endpoint', async () => {
    // Ensure seeded users exist in prisma mock for document ownership relation.
    await request(asSupertestApp(app)).post('/api/v1/auth/login').send({
      email: 'admin@mopd.local',
      password: 'AdminPass123!',
    });

    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Evidence upload test from public flow',
        description:
          'This complaint is used to validate tokenized evidence upload for unauthenticated users.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
        requestUploadSession: true,
      })
      .expect(201);

    const createdBody = getBody<ComplaintCreateResponse>(created);
    const uploadToken = createdBody.data.uploadSession?.token;
    expect(uploadToken).toBeDefined();

    const upload = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/evidence`)
      .field('uploadToken', uploadToken as string)
      .attach('file', Buffer.from('%PDF-1.4 public-evidence-test'), {
        filename: 'public-evidence.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const uploadBody = getBody<{
      data: { complaintId: string; scanStatus: string };
    }>(upload);
    expect(uploadBody.data.complaintId).toBe(createdBody.data.id);
    expect(uploadBody.data.scanStatus).toBe('CLEAN');
  });

  it('tracks complaint by reference number', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Delayed fertilizer delivery',
        description:
          'Fertilizer delivery for kebele farmers has been delayed for the current season without notification.',
        channel: 'WEB',
        complainantName: 'Meron Tadesse',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);

    const tracked = await request(asSupertestApp(app))
      .get(`/api/v1/complaints/track/${createdBody.data.referenceNo}`)
      .expect(200);
    const trackedBody = getBody<ComplaintTrackResponse>(tracked);

    expect(trackedBody.data.referenceNo).toBe(createdBody.data.referenceNo);
    expect(trackedBody.data.status).toBe('SUBMITTED');
  });

  it('rejects complaint submission without consent', async () => {
    const response = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Electricity outage',
        description:
          'Neighborhood has had repeated outages for over two weeks and no response from local office.',
        channel: 'WEB',
        consentGiven: false,
        locale: 'en',
      })
      .expect(422);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns NOT_FOUND for unknown complaint reference', async () => {
    const response = await request(asSupertestApp(app))
      .get('/api/v1/complaints/track/CMS-2099-999999')
      .expect(404);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('queues complaint_submitted_ack delivery when complainant email is present', async () => {
    await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Road project delay in zone 3',
        description:
          'Road expansion in zone 3 has remained incomplete for over 8 months without clear status updates.',
        channel: 'WEB',
        complainantEmail: 'citizen@example.com',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);

    const adminLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mopd.local',
        password: 'AdminPass123!',
      })
      .expect(200);
    const auth = getBody<LoginResponse>(adminLogin);

    const list = await request(asSupertestApp(app))
      .get('/api/v1/notifications')
      .query({ templateKey: 'complaint_submitted_ack', pageSize: 50 })
      .set('Authorization', `Bearer ${auth.data.accessToken}`)
      .expect(200);

    const envelopes = getBody<{
      data: Array<{ templateKey: string; to: string }>;
      meta: { total: number };
    }>(list);
    expect(envelopes.data.length).toBeGreaterThanOrEqual(1);
    expect(envelopes.data.some((d) => d.to === 'citizen@example.com')).toBe(
      true,
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
