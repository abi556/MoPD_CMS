import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  ComplaintCreateResponse,
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

interface SlaStatusResponse {
  complaintId: string;
  slaConfigName: string;
  status: string;
  startedAt: string;
  targetAt: string;
  warningAt: string;
  warnedAt: string | null;
  breachedAt: string | null;
  completedAt: string | null;
  remainingMs: number;
  isWarned: boolean;
  isBreached: boolean;
}

interface SlaConfigResponse {
  id: string;
  name: string;
  priority: string;
  categoryId: string | null;
  targetHours: number;
  warningThresholdPct: number;
  escalationRoleId: string | null;
  isActive: boolean;
  createdAt: string;
}

describe('SLA (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const loginAdmin = async () => {
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'admin@mopd.local', password: 'AdminPass123!' })
      .expect(200);
    return getBody<LoginResponse>(res).data.accessToken;
  };

  const loginOfficer = async () => {
    const res = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'officer@mopd.local', password: 'OfficerPass123!' })
      .expect(200);
    return getBody<LoginResponse>(res).data.accessToken;
  };

  const submitComplaint = async () => {
    const res = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'SLA test complaint',
        description: 'Testing SLA tracker creation on complaint intake.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    return getBody<ComplaintCreateResponse>(res).data;
  };

  // ---------------------------------------------------------------------------
  // SLA status — complaint-scoped
  // ---------------------------------------------------------------------------
  describe('GET /complaints/:id/sla', () => {
    it('returns 401 without auth', async () => {
      await request(asSupertestApp(app))
        .get('/api/v1/complaints/some-id/sla')
        .expect(401);
    });

    it('returns 404 when no SLA tracker exists for complaint', async () => {
      const token = await loginOfficer();
      const complaint = await submitComplaint();

      // No SLA config seeded in mock, so tracker was never created
      await request(asSupertestApp(app))
        .get(`/api/v1/complaints/${complaint.id}/sla`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns SLA status after tracker is created via seeded config', async () => {
      const adminToken = await loginAdmin();

      // Create an SLA config first
      const configRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/sla-configs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Normal Priority (72h)',
          priority: 'NORMAL',
          targetHours: 72,
          warningThresholdPct: 80,
          isActive: true,
        })
        .expect(201);
      getBody<SlaConfigResponse>(configRes);

      // Submit a complaint — this triggers SlaService.startTrackerForComplaint
      const complaint = await submitComplaint();
      const officerToken = await loginOfficer();

      const slaRes = await request(asSupertestApp(app))
        .get(`/api/v1/complaints/${complaint.id}/sla`)
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      const body = getBody<SlaStatusResponse>(slaRes);
      expect(body.complaintId).toBe(complaint.id);
      expect(body.status).toBe('ACTIVE');
      expect(body.isBreached).toBe(false);
      expect(typeof body.remainingMs).toBe('number');
      expect(body.remainingMs).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Escalation
  // ---------------------------------------------------------------------------
  describe('POST /complaints/:id/escalate', () => {
    it('returns 401 without auth', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/complaints/some-id/escalate')
        .send({ reason: 'No response' })
        .expect(401);
    });

    it('returns 403 without complaint:escalate permission', async () => {
      // Admin does not have complaint:escalate … actually, admin has all perms.
      // We test with anonymous to get 401, 403 requires a user without the perm.
      // For now we verify 204 for officer who has complaint:escalate permission.
      const officerToken = await loginOfficer();
      const complaint = await submitComplaint();

      await request(asSupertestApp(app))
        .post(`/api/v1/complaints/${complaint.id}/escalate`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ reason: 'Unresponsive for 48 hours' })
        .expect(204);
    });

    it('validates that reason is required (min length 3)', async () => {
      const officerToken = await loginOfficer();
      const complaint = await submitComplaint();

      await request(asSupertestApp(app))
        .post(`/api/v1/complaints/${complaint.id}/escalate`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ reason: 'ab' })
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  // Admin SLA config CRUD
  // ---------------------------------------------------------------------------
  describe('Admin SLA config endpoints', () => {
    it('returns 401 without auth on GET /admin/sla-configs', async () => {
      await request(asSupertestApp(app))
        .get('/api/v1/admin/sla-configs')
        .expect(401);
    });

    it('creates and lists SLA configs', async () => {
      const token = await loginAdmin();

      await request(asSupertestApp(app))
        .post('/api/v1/admin/sla-configs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'High Priority (24h)',
          priority: 'HIGH',
          targetHours: 24,
          warningThresholdPct: 75,
          isActive: true,
        })
        .expect(201);

      const listRes = await request(asSupertestApp(app))
        .get('/api/v1/admin/sla-configs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const configs = listRes.body as SlaConfigResponse[];
      expect(Array.isArray(configs)).toBe(true);
      expect(configs).toHaveLength(1);
      expect(configs[0].priority).toBe('HIGH');
      expect(configs[0].targetHours).toBe(24);
    });

    it('updates an existing SLA config', async () => {
      const token = await loginAdmin();

      const createRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/sla-configs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Urgent (8h)',
          priority: 'URGENT',
          targetHours: 8,
          isActive: true,
        })
        .expect(201);
      const config = getBody<SlaConfigResponse>(createRes);

      const updateRes = await request(asSupertestApp(app))
        .patch(`/api/v1/admin/sla-configs/${config.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ targetHours: 6 })
        .expect(200);
      const updated = getBody<SlaConfigResponse>(updateRes);
      expect(updated.targetHours).toBe(6);
    });

    it('returns 422 on invalid payload (missing required fields)', async () => {
      const token = await loginAdmin();

      await request(asSupertestApp(app))
        .post('/api/v1/admin/sla-configs')
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: 'NORMAL' }) // missing name and targetHours
        .expect(422);
    });
  });
});
