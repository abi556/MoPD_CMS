import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

interface CategoryResponse {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface OrgUnitResponse {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

describe('Reference Data (e2e)', () => {
  let app: INestApplication<Server>;
  let adminToken: string;
  let officerToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    const adminLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'admin@mopd.local', password: 'AdminPass123!' });
    adminToken = getBody<LoginResponse>(adminLogin).data.accessToken;

    const officerLogin = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({ email: 'officer@mopd.local', password: 'OfficerPass123!' });
    officerToken = getBody<LoginResponse>(officerLogin).data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Complaint Categories
  // ---------------------------------------------------------------------------

  describe('POST /api/v1/admin/complaint-categories', () => {
    it('creates a category (admin)', async () => {
      const res = await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'ROAD_INFRA',
          nameEn: 'Road Infrastructure',
          nameAm: 'የመንገድ መሠረተ ልማት',
          sortOrder: 1,
        })
        .expect(201);

      const cat = getBody<CategoryResponse>(res);
      expect(cat.code).toBe('ROAD_INFRA');
      expect(cat.nameEn).toBe('Road Infrastructure');
      expect(cat.nameAm).toBe('የመንገድ መሠረተ ልማት');
      expect(cat.isActive).toBeTruthy();
    });

    it('rejects duplicate code', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'ROAD_INFRA',
          nameEn: 'Duplicate attempt',
        })
        .expect(409);
    });

    it('rejects bad code format', async () => {
      const res = await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'bad-code',
          nameEn: 'Bad code format',
        });
      expect([400, 422]).toContain(res.status);
    });

    it('returns 403 for officer (no config:manage)', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          code: 'WATER',
          nameEn: 'Water',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/complaint-categories', () => {
    it('lists all categories', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'EDUCATION', nameEn: 'Education', sortOrder: 5 });

      const res = await request(asSupertestApp(app))
        .get('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const cats = getBody<CategoryResponse[]>(res);
      expect(cats.length).toBeGreaterThanOrEqual(2);
      expect(cats.map((c) => c.code)).toContain('ROAD_INFRA');
      expect(cats.map((c) => c.code)).toContain('EDUCATION');
    });
  });

  describe('PATCH /api/v1/admin/complaint-categories/:id', () => {
    it('updates a category name', async () => {
      const createRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'HEALTH', nameEn: 'Health' })
        .expect(201);

      const cat = getBody<CategoryResponse>(createRes);

      const patchRes = await request(asSupertestApp(app))
        .patch(`/api/v1/admin/complaint-categories/${cat.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nameEn: 'Public Health', isActive: false })
        .expect(200);

      const updated = getBody<CategoryResponse>(patchRes);
      expect(updated.nameEn).toBe('Public Health');
      expect(updated.isActive).toBe(false);
    });
  });

  describe('Hierarchical categories', () => {
    it('creates a child category', async () => {
      const parentRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'TRANSPORT', nameEn: 'Transport', sortOrder: 10 })
        .expect(201);
      const parent = getBody<CategoryResponse>(parentRes);

      const childRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TRANSPORT_BUS',
          nameEn: 'Bus Transport',
          parentId: parent.id,
          sortOrder: 11,
        })
        .expect(201);

      const child = getBody<CategoryResponse>(childRes);
      expect(child.parentId).toBe(parent.id);
    });

    it('rejects non-existent parent', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'ORPHAN',
          nameEn: 'Orphan',
          parentId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // Org Units
  // ---------------------------------------------------------------------------

  describe('POST /api/v1/admin/org-units', () => {
    it('creates an org unit (admin)', async () => {
      const res = await request(asSupertestApp(app))
        .post('/api/v1/admin/org-units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'DIR_COMPLAINTS',
          nameEn: 'Complaints Directorate',
          nameAm: 'የቅሬታ ዳይሬክቶሬት',
          sortOrder: 1,
        })
        .expect(201);

      const unit = getBody<OrgUnitResponse>(res);
      expect(unit.code).toBe('DIR_COMPLAINTS');
      expect(unit.nameEn).toBe('Complaints Directorate');
      expect(unit.isActive).toBeTruthy();
    });

    it('rejects duplicate code', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/admin/org-units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'DIR_COMPLAINTS',
          nameEn: 'Duplicate',
        })
        .expect(409);
    });

    it('returns 403 for officer', async () => {
      await request(asSupertestApp(app))
        .post('/api/v1/admin/org-units')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ code: 'DIR_X', nameEn: 'X' })
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/org-units', () => {
    it('lists org units', async () => {
      const res = await request(asSupertestApp(app))
        .get('/api/v1/admin/org-units')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const units = getBody<OrgUnitResponse[]>(res);
      expect(units.length).toBeGreaterThanOrEqual(1);
      expect(units.map((u) => u.code)).toContain('DIR_COMPLAINTS');
    });
  });

  describe('PATCH /api/v1/admin/org-units/:id', () => {
    it('updates an org unit', async () => {
      const createRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/org-units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'DIR_ICT', nameEn: 'ICT' })
        .expect(201);

      const unit = getBody<OrgUnitResponse>(createRes);

      const patchRes = await request(asSupertestApp(app))
        .patch(`/api/v1/admin/org-units/${unit.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nameEn: 'ICT Directorate' })
        .expect(200);

      const updated = getBody<OrgUnitResponse>(patchRes);
      expect(updated.nameEn).toBe('ICT Directorate');
    });
  });

  // ---------------------------------------------------------------------------
  // Complaint with categoryId
  // ---------------------------------------------------------------------------

  describe('Complaint creation with categoryId', () => {
    it('creates complaint with valid category', async () => {
      const catRes = await request(asSupertestApp(app))
        .post('/api/v1/admin/complaint-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'ELECTRICITY', nameEn: 'Electricity', sortOrder: 3 })
        .expect(201);
      const cat = getBody<CategoryResponse>(catRes);

      const cmpRes = await request(asSupertestApp(app))
        .post('/api/v1/complaints')
        .send({
          subject: 'Power outage in zone 4',
          description: 'Electricity has been off for 48 hours in the central zone.',
          channel: 'WEB',
          consentGiven: true,
          locale: 'en',
          categoryId: cat.id,
        })
        .expect(201);

      expect(cmpRes.body.data).toBeDefined();
      expect(cmpRes.body.data.referenceNo).toBeDefined();
    });

    it('rejects complaint with non-existent categoryId', async () => {
      const res = await request(asSupertestApp(app))
        .post('/api/v1/complaints')
        .send({
          subject: 'Bad category test complaint submission',
          description: 'This has a fake category ID that should fail validation.',
          channel: 'WEB',
          consentGiven: true,
          locale: 'en',
          categoryId: 'non-existent-category-id',
        });
      expect([400, 422]).toContain(res.status);
    });
  });
});
