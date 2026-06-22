import { ROLE_CATALOG } from './role-catalog';

export interface SeedPermission {
  id: string;
  code: string;
  description: string;
}

export const SEED_PERMISSIONS: SeedPermission[] = [
  {
    id: 'perm-admin-ping',
    code: 'admin:ping',
    description: 'Access admin health endpoint.',
  },
  {
    id: 'perm-complaints-list',
    code: 'complaints:list',
    description: 'List complaints for staff operations.',
  },
  {
    id: 'perm-complaints-detail',
    code: 'complaints:detail',
    description: 'View complaint detail for staff workflows.',
  },
  {
    id: 'perm-complaints-history',
    code: 'complaints:history',
    description: 'View complaint history timeline.',
  },
  {
    id: 'perm-complaints-assign',
    code: 'complaints:assign',
    description: 'Assign or reassign complaint ownership.',
  },
  {
    id: 'perm-complaints-transition',
    code: 'complaints:transition',
    description: 'Transition complaint workflow status.',
  },
  {
    id: 'perm-complaint-read',
    code: 'complaint:read',
    description: 'Read all complaints (unscoped).',
  },
  {
    id: 'perm-complaint-read-own',
    code: 'complaint:read:own',
    description: 'Read complaints assigned to the current user.',
  },
  {
    id: 'perm-complaint-review',
    code: 'complaint:review',
    description: 'Submit complaints to QA/legal review.',
  },
  {
    id: 'perm-complaint-triage',
    code: 'complaint:triage',
    description: 'Move submitted complaints into triage.',
  },
  {
    id: 'perm-complaint-assign-canonical',
    code: 'complaint:assign',
    description: 'Assign or reassign complaints to any officer.',
  },
  {
    id: 'perm-complaint-assign-self',
    code: 'complaint:assign:self',
    description: 'Self-assign unassigned triage complaints.',
  },
  {
    id: 'perm-complaint-investigate',
    code: 'complaint:investigate',
    description: 'Perform investigation and draft work on assigned complaints.',
  },
  {
    id: 'perm-complaint-publish',
    code: 'complaint:publish',
    description: 'Publish issued responses to await complainant feedback.',
  },
  {
    id: 'perm-complaint-close',
    code: 'complaint:close',
    description: 'Close complaints after feedback period.',
  },
  {
    id: 'perm-complaint-approve',
    code: 'complaint:approve',
    description: 'Approve draft responses for issuance.',
  },
  {
    id: 'perm-complaint-update',
    code: 'complaint:update',
    description: 'Update complaint metadata (non-status fields).',
  },
  {
    id: 'perm-complaint-recovery-manage',
    code: 'complaint:recovery:manage',
    description: 'Manage manual reference recovery inquiries.',
  },
  {
    id: 'perm-workflow-transition',
    code: 'workflow:transition',
    description: 'Perform workflow transitions and assignments.',
  },
  {
    id: 'perm-user-manage',
    code: 'user:manage',
    description: 'Manage users lifecycle and profile updates.',
  },
  {
    id: 'perm-role-manage',
    code: 'role:manage',
    description: 'Manage roles and permission mappings.',
  },
  {
    id: 'perm-complaint-escalate',
    code: 'complaint:escalate',
    description: 'Escalate a complaint to higher priority handling.',
  },
  {
    id: 'perm-config-manage',
    code: 'config:manage',
    description: 'Manage system configuration (SLA, categories, org units).',
  },
  {
    id: 'perm-sla-configure',
    code: 'sla:configure',
    description: 'Configure SLA rules and thresholds.',
  },
  {
    id: 'perm-notification-manage',
    code: 'notification:manage',
    description: 'Manage notification deliveries.',
  },
  {
    id: 'perm-notification-read',
    code: 'notification:read',
    description: 'Read notification delivery status.',
  },
  {
    id: 'perm-template-manage',
    code: 'template:manage',
    description: 'Manage notification templates.',
  },
  {
    id: 'perm-case-read',
    code: 'case:read',
    description: 'List case notes and tasks on complaints.',
  },
  {
    id: 'perm-case-write',
    code: 'case:write',
    description: 'Create and update case notes and tasks on complaints.',
  },
  {
    id: 'perm-document-upload',
    code: 'document:upload',
    description: 'Upload documents to complaints.',
  },
  {
    id: 'perm-document-read',
    code: 'document:read',
    description: 'View document metadata and download clean files.',
  },
  {
    id: 'perm-document-delete',
    code: 'document:delete',
    description: 'Delete documents from complaints.',
  },
  {
    id: 'perm-audit-read',
    code: 'audit:read',
    description: 'Query and export audit logs.',
  },
  {
    id: 'perm-report-view',
    code: 'report:view',
    description: 'View analytics dashboards.',
  },
  {
    id: 'perm-report-export',
    code: 'report:export',
    description: 'Generate and download report exports.',
  },
  {
    id: 'perm-knowledge-manage',
    code: 'knowledge:manage',
    description: 'Manage Melhiq chatbot knowledge base articles.',
  },
  {
    id: 'perm-chatbot-analytics-read',
    code: 'chatbot:analytics:read',
    description: 'View Melhiq chatbot analytics reports.',
  },
];

const P = Object.fromEntries(
  SEED_PERMISSIONS.map((permission) => [permission.code, permission.id]),
) as Record<string, string>;

/** Role id → permission ids for AUTH_SEED_ENABLED bootstrap. */
export const ROLE_PERMISSION_IDS: Record<string, string[]> = {
  'role-super-admin': SEED_PERMISSIONS.map((permission) => permission.id),
  'role-system-admin': [
    P['admin:ping'],
    P['user:manage'],
    P['role:manage'],
    P['config:manage'],
    P['sla:configure'],
    P['template:manage'],
    P['notification:manage'],
    P['knowledge:manage'],
    P['chatbot:analytics:read'],
  ],
  'role-complaints-admin': [
    P['complaint:read'],
    P['complaint:triage'],
    P['complaint:assign'],
    P['complaint:close'],
    P['complaint:publish'],
    P['workflow:transition'],
    P['complaint:escalate'],
    P['complaints:list'],
    P['complaints:detail'],
    P['complaints:history'],
    P['complaint:update'],
    P['complaint:recovery:manage'],
  ],
  'role-case-officer': [
    P['complaint:read:own'],
    P['complaints:list'],
    P['complaints:detail'],
    P['complaints:history'],
    P['complaint:assign:self'],
    P['complaint:investigate'],
    P['complaint:escalate'],
    P['case:read'],
    P['case:write'],
    P['document:upload'],
    P['document:read'],
    P['document:delete'],
    P['complaint:update'],
  ],
  'role-reviewer-approver': [
    P['complaint:read'],
    P['complaint:review'],
    P['complaint:approve'],
    P['complaints:list'],
    P['complaints:detail'],
    P['complaints:history'],
    P['document:read'],
  ],
  'role-communications-officer': [
    P['notification:manage'],
    P['notification:read'],
    P['template:manage'],
    P['knowledge:manage'],
    P['chatbot:analytics:read'],
  ],
  'role-auditor': [P['audit:read'], P['report:view'], P['report:export']],
  'role-ombudsperson': [
    P['complaint:read'],
    P['audit:read'],
    P['report:view'],
    P['complaint:escalate'],
    P['complaints:list'],
    P['complaints:detail'],
    P['complaints:history'],
    P['complaint:recovery:manage'],
  ],
  'role-read-only-observer': [
    P['complaint:read'],
    P['report:view'],
    P['complaints:list'],
    P['complaints:detail'],
    P['complaints:history'],
  ],
};

export function getSeedRoles(): Array<{ id: string; name: string }> {
  return ROLE_CATALOG.map((role) => ({ id: role.id, name: role.name }));
}

export function getRolePermissionIds(roleId: string): string[] {
  return ROLE_PERMISSION_IDS[roleId] ?? [];
}
