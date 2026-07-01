import request from 'supertest';
import type { App as SupertestApp } from 'supertest/types';
import type { LoginResponse } from './types';
import { getBody } from './utils';

export const E2E_ROLE_CREDENTIALS = {
  SuperAdmin: {
    email: 'admin@mopd.local',
    password: 'AdminPass123!',
  },
  CaseOfficer: {
    email: 'officer@mopd.local',
    password: 'OfficerPass123!',
  },
  SystemAdmin: {
    email: 'system-admin@mopd.local',
    password: 'SystemAdminPass123!',
  },
  ComplaintsAdmin: {
    email: 'complaints-admin@mopd.local',
    password: 'ComplaintsAdminPass123!',
  },
  ReviewerApprover: {
    email: 'reviewer@mopd.local',
    password: 'ReviewerPass123!',
  },
  CommunicationsOfficer: {
    email: 'communications@mopd.local',
    password: 'CommunicationsPass123!',
  },
  Auditor: {
    email: 'auditor@mopd.local',
    password: 'AuditorPass123!',
  },
  Ombudsperson: {
    email: 'ombudsperson@mopd.local',
    password: 'OmbudspersonPass123!',
  },
  ReadOnlyObserver: {
    email: 'observer@mopd.local',
    password: 'ObserverPass123!',
  },
} as const;

export type E2eRoleName = keyof typeof E2E_ROLE_CREDENTIALS;

export async function loginAsRole(
  httpServer: SupertestApp,
  role: E2eRoleName,
): Promise<string> {
  const credentials = E2E_ROLE_CREDENTIALS[role];
  const response = await request(httpServer)
    .post('/api/v1/auth/login')
    .send(credentials)
    .expect(200);
  const body = getBody<LoginResponse>(response);
  if (!body.data.accessToken) {
    throw new Error(
      `Login returned no accessToken for role ${role} — MFA may be required`,
    );
  }
  return body.data.accessToken;
}
