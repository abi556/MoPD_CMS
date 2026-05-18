import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  asSupertestApp,
  createTestApp,
  getBody,
  type LoginResponse,
} from './helpers/test-context';

interface ComplaintCreateResponse {
  data: { id: string; referenceNo: string };
}

interface DocumentResponse {
  data: {
    id: string;
    complaintId: string;
    scanStatus: string;
    originalName: string;
  };
}

interface DocumentDownloadResponse {
  data: { url: string; expiresAt: string };
}

describe('Documents (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  async function loginOfficer(): Promise<string> {
    const login = await request(asSupertestApp(app))
      .post('/api/v1/auth/login')
      .send({
        email: 'officer@mopd.local',
        password: 'OfficerPass123!',
      })
      .expect(200);
    return getBody<LoginResponse>(login).data.accessToken;
  }

  async function createComplaint(): Promise<string> {
    const created = await request(asSupertestApp(app))
      .post('/api/v1/complaints')
      .send({
        subject: 'Document upload e2e test',
        description: 'Complaint used for document module e2e coverage.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    return getBody<ComplaintCreateResponse>(created).data.id;
  }

  it('uploads, scans clean, downloads, and deletes a document', async () => {
    const token = await loginOfficer();
    const complaintId = await createComplaint();

    const upload = await request(asSupertestApp(app))
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('complaintId', complaintId)
      .attach('file', Buffer.from('%PDF-1.4 test'), {
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const uploadBody = getBody<DocumentResponse>(upload);
    expect(uploadBody.data.scanStatus).toBe('CLEAN');
    expect(uploadBody.data.complaintId).toBe(complaintId);

    const meta = await request(asSupertestApp(app))
      .get(`/api/v1/documents/${uploadBody.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(getBody<DocumentResponse>(meta).data.scanStatus).toBe('CLEAN');

    const download = await request(asSupertestApp(app))
      .get(`/api/v1/documents/${uploadBody.data.id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(getBody<DocumentDownloadResponse>(download).data.url).toContain(
      'memory://',
    );

    await request(asSupertestApp(app))
      .delete(`/api/v1/documents/${uploadBody.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(asSupertestApp(app))
      .get(`/api/v1/documents/${uploadBody.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('marks EICAR upload as infected and blocks download with 409', async () => {
    const token = await loginOfficer();
    const complaintId = await createComplaint();
    const eicar =
      'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

    const upload = await request(asSupertestApp(app))
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('complaintId', complaintId)
      .attach('file', Buffer.from(eicar), {
        filename: 'eicar.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const uploadBody = getBody<DocumentResponse>(upload);
    expect(uploadBody.data.scanStatus).toBe('INFECTED');

    await request(asSupertestApp(app))
      .get(`/api/v1/documents/${uploadBody.data.id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });
});
