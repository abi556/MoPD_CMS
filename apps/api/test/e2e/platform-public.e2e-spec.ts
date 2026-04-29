import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  ComplaintCreateResponse,
  ComplaintTrackResponse,
  ErrorEnvelope,
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

  afterEach(async () => {
    await app.close();
  });
});

