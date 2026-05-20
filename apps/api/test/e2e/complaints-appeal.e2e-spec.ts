import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { loginAsRole } from './helpers/login-as-role';
import {
  ComplaintCreateResponse,
  ComplaintDetailResponse,
  ErrorEnvelope,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

describe('Complaints appeal and patch (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('patches complaint metadata with complaint:update permission', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Metadata patch test case',
        description:
          'Case officer updates non-status metadata on an assigned complaint.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);
    const officerToken = await loginAsRole(asSupertestApp(app), 'CaseOfficer');

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${createdBody.data.id}/transition`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ toStatus: 'TRIAGE', reason: 'Triage before metadata patch.' })
      .expect(200);

    const patched = await request(asSupertestApp(app))
      .patch(`/api/v1/complaints/${createdBody.data.id}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ priority: 'HIGH' })
      .expect(200);
    const patchedBody = getBody<ComplaintDetailResponse>(patched);
    expect(patchedBody.data.id).toBe(createdBody.data.id);
  });

  it('returns workflow_forbidden when officer transitions to QA without review permission', async () => {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'QA transition policy test',
        description:
          'Case officer cannot move directly to QA legal review without review permission.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    const createdBody = getBody<ComplaintCreateResponse>(created);
    const officerToken = await loginAsRole(asSupertestApp(app), 'CaseOfficer');
    const complaintId = createdBody.data.id;

    const steps = [
      'TRIAGE',
      'ASSIGNED',
      'IN_INVESTIGATION',
      'DRAFT_RESPONSE',
    ] as const;
    for (const toStatus of steps) {
      if (toStatus === 'ASSIGNED') {
        await request(asSupertestApp(app))
          .post(`/api/v1/complaints/${complaintId}/assign`)
          .set('Authorization', `Bearer ${officerToken}`)
          .send({
            assigneeUserId: 'user-officer-0001',
            reason: 'Self-assign for workflow policy test.',
          })
          .expect(200);
        continue;
      }
      await request(asSupertestApp(app))
        .post(`/api/v1/complaints/${complaintId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          toStatus,
          reason: `Advance to ${toStatus} for QA policy test.`,
        })
        .expect(200);
    }

    const response = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${complaintId}/transition`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        toStatus: 'QA_LEGAL_REVIEW',
        reason: 'Should require complaint:review permission.',
      })
      .expect(422);
    const err = getBody<ErrorEnvelope>(response);
    expect(err.error.code).toBe('workflow_forbidden');
  });
});
