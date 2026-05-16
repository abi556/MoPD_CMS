import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  ComplaintCreateResponse,
  ErrorEnvelope,
  LoginResponse,
  asSupertestApp,
  createTestApp,
  getBody,
} from './helpers/test-context';

interface CaseNoteListResponse {
  data: Array<{
    id: string;
    complaintId: string;
    authorUserId: string;
    body: string;
    visibility: string;
    createdAt: string;
  }>;
}

interface CaseNoteResponse {
  data: CaseNoteListResponse['data'][0];
}

interface CaseTaskListResponse {
  data: Array<{
    id: string;
    complaintId: string;
    assigneeUserId: string;
    createdByUserId: string;
    title: string;
    status: string;
    dueAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface CaseTaskResponse {
  data: CaseTaskListResponse['data'][0];
}

describe('Case Collaboration (e2e)', () => {
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
        subject: 'Case collaboration test complaint',
        description: 'Used for notes and tasks e2e coverage.',
        channel: 'WEB',
        consentGiven: true,
        locale: 'en',
      })
      .expect(201);
    return getBody<ComplaintCreateResponse>(created).data.id;
  }

  it('rejects notes list without authentication', async () => {
    await request(asSupertestApp(app))
      .get('/api/v1/complaints/cmp_any/notes')
      .expect(401);
  });

  it('returns 404 for notes on unknown complaint', async () => {
    const token = await loginOfficer();
    const response = await request(asSupertestApp(app))
      .get('/api/v1/complaints/cmp_missing/notes')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.message).toMatch(/not found/i);
  });

  it('creates and lists notes on a complaint', async () => {
    const complaintId = await createComplaint();
    const token = await loginOfficer();

    const created = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${complaintId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: 'Called complainant; awaiting documents.',
        visibility: 'INTERNAL',
      })
      .expect(201);
    const createdBody = getBody<CaseNoteResponse>(created);
    expect(createdBody.data.body).toContain('awaiting documents');
    expect(created.headers.location).toContain(`/notes/${createdBody.data.id}`);

    const list = await request(asSupertestApp(app))
      .get(`/api/v1/complaints/${complaintId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const listBody = getBody<CaseNoteListResponse>(list);
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].id).toBe(createdBody.data.id);
  });

  it('creates, lists, and updates tasks on a complaint', async () => {
    const complaintId = await createComplaint();
    const token = await loginOfficer();

    const created = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${complaintId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Request land registry extract',
        assigneeUserId: 'user-officer-0001',
        dueAt: '2026-05-20T12:00:00.000Z',
      })
      .expect(201);
    const createdBody = getBody<CaseTaskResponse>(created);
    expect(createdBody.data.status).toBe('OPEN');
    expect(created.headers.location).toContain(`/tasks/${createdBody.data.id}`);

    const list = await request(asSupertestApp(app))
      .get(`/api/v1/complaints/${complaintId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const listBody = getBody<CaseTaskListResponse>(list);
    expect(listBody.data).toHaveLength(1);

    const updated = await request(asSupertestApp(app))
      .patch(`/api/v1/complaints/${complaintId}/tasks/${createdBody.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' })
      .expect(200);
    const updatedBody = getBody<CaseTaskResponse>(updated);
    expect(updatedBody.data.status).toBe('DONE');
  });

  it('returns 422 when assignee is invalid', async () => {
    const complaintId = await createComplaint();
    const token = await loginOfficer();

    const response = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${complaintId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid assignee task',
        assigneeUserId: 'user-does-not-exist',
      })
      .expect(422);
    const body = getBody<ErrorEnvelope>(response);
    expect(body.error.message).toMatch(/assignee|inactive|invalid/i);
  });

  it('returns 422 when note body is empty', async () => {
    const complaintId = await createComplaint();
    const token = await loginOfficer();

    await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${complaintId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '' })
      .expect(422);
  });

  it('returns 422 when task patch body is empty', async () => {
    const complaintId = await createComplaint();
    const token = await loginOfficer();

    const created = await request(asSupertestApp(app))
      .post(`/api/v1/complaints/${complaintId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Patch validation task',
        assigneeUserId: 'user-officer-0001',
      })
      .expect(201);
    const taskId = getBody<CaseTaskResponse>(created).data.id;

    await request(asSupertestApp(app))
      .patch(`/api/v1/complaints/${complaintId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(422);
  });

  it('returns 404 when task id does not belong to complaint', async () => {
    const complaintId = await createComplaint();
    const token = await loginOfficer();

    await request(asSupertestApp(app))
      .patch(`/api/v1/complaints/${complaintId}/tasks/case_task_nonexistent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' })
      .expect(404);
  });

  it('returns 404 for POST tasks on unknown complaint', async () => {
    const token = await loginOfficer();

    await request(asSupertestApp(app))
      .post('/api/v1/complaints/cmp_missing/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Orphan task',
        assigneeUserId: 'user-officer-0001',
      })
      .expect(404);
  });
});
