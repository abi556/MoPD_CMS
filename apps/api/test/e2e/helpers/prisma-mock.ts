import { randomUUID } from 'node:crypto';
import { NOTIFICATION_TEMPLATE_SEEDS } from '../../../src/modules/notifications/notification-seed';
import { PrismaService } from '../../../src/prisma/prisma.service';
import type { ComplaintStatusLiteral } from './types';

type PriorityLiteral = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type SlaStatusLiteral = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BREACHED';

interface StoredComplaint {
  id: string;
  sequenceNo: number;
  referenceNo: string;
  status: ComplaintStatusLiteral;
  priority: PriorityLiteral;
  categoryId: string | null;
  orgUnitId: string | null;
  channel: 'WEB' | 'ASSISTED' | 'EMAIL' | 'SMS' | 'USSD';
  subject: string;
  description: string;
  submittedAt: Date;
  locale: 'en' | 'am';
  consentGiven: boolean;
  complainantName: string | null;
  complainantEmail: string | null;
  complainantPhone: string | null;
  assignedToUserId: string | null;
  assignedByUserId: string | null;
  assignedAt: Date | null;
  assignmentReason: string | null;
  lastTransitionByUserId: string | null;
  lastTransitionAt: Date | null;
  lastTransitionReason: string | null;
  updatedAt: Date;
}

interface StoredComplaintHistory {
  id: string;
  complaintId: string;
  action: 'ASSIGNED' | 'TRANSITIONED';
  fromStatus: StoredComplaint['status'] | null;
  toStatus: StoredComplaint['status'];
  actorUserId: string;
  reason: string | null;
  createdAt: Date;
}

interface StoredRole {
  id: string;
  name: string;
}

interface StoredPermission {
  id: string;
  code: string;
  description?: string;
}

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordVersion: number;
  mustChangePassword: boolean;
  mustEnrollMfa: boolean;
  mfaEnabled: boolean;
  mfaMethod: string | null;
  totpSecret: string | null;
  totpVerifiedAt: Date | null;
  preferredLocale?: 'en' | 'am' | null;
  isActive: boolean;
}

interface StoredAuditLog {
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorRole: string | null;
  entityType: string | null;
  entityId: string | null;
  correlationId: string | null;
  metadata: unknown;
  createdAt: Date;
}

interface StoredComplaintCategory {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredOrgUnit {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredSlaConfig {
  id: string;
  name: string;
  priority: PriorityLiteral;
  categoryId: string | null;
  targetHours: number;
  warningThresholdPct: number;
  escalationRoleId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredComplaintSla {
  id: string;
  complaintId: string;
  slaConfigId: string;
  startedAt: Date;
  targetAt: Date;
  warningAt: Date;
  warnedAt: Date | null;
  breachedAt: Date | null;
  completedAt: Date | null;
  status: SlaStatusLiteral;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredNotificationTemplate {
  id: string;
  key: string;
  locale: 'en' | 'am';
  channel: 'email' | 'sms';
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredNotificationDelivery {
  id: string;
  templateKey: string;
  to: string;
  channel: 'email' | 'sms';
  status: 'queued' | 'sent' | 'failed';
  retries: number;
  lastError: string | null;
  sentAt: Date | null;
  correlationId: string | null;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredCaseNote {
  id: string;
  complaintId: string;
  authorId: string;
  body: string;
  visibility: 'INTERNAL' | 'RESTRICTED';
  createdAt: Date;
}

interface StoredCaseTask {
  id: string;
  complaintId: string;
  assigneeId: string;
  createdById: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredDocument {
  id: string;
  complaintId: string;
  ownerUserId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: 'PENDING' | 'SCANNING' | 'CLEAN' | 'INFECTED' | 'FAILED';
  storageKey: string;
  quarantineKey: string | null;
  liveKey: string | null;
  scanError: string | null;
  scannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredReportExport {
  id: string;
  requestedById: string;
  format: 'csv' | 'xlsx' | 'pdf';
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'EXPIRED';
  filters: unknown;
  storageKey: string | null;
  mimeType: string | null;
  rowCount: number | null;
  errorMessage: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
}

interface StoredUserNotification {
  id: string;
  userId: string;
  type: string;
  severity: string;
  messageKey: string;
  messageParams: unknown;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  dedupKey: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export function createPrismaMock(): PrismaService {
  const store = new Map<string, StoredComplaint>();
  const historyStore: StoredComplaintHistory[] = [];
  const roleStore = new Map<string, StoredRole>();
  const permissionStore = new Map<string, StoredPermission>();
  const userStore = new Map<string, StoredUser>();
  const auditLogStore: StoredAuditLog[] = [];
  const userRoleStore = new Set<string>();
  const rolePermissionStore = new Set<string>();
  const categoryStore = new Map<string, StoredComplaintCategory>();
  const orgUnitStore = new Map<string, StoredOrgUnit>();
  const slaConfigStore = new Map<string, StoredSlaConfig>();
  const complaintSlaStore = new Map<string, StoredComplaintSla>();
  const notificationTemplateStore = new Map<
    string,
    StoredNotificationTemplate
  >();
  const notificationDeliveryStore = new Map<
    string,
    StoredNotificationDelivery
  >();
  const caseNoteStore = new Map<string, StoredCaseNote>();
  const caseTaskStore = new Map<string, StoredCaseTask>();
  const documentStore = new Map<string, StoredDocument>();
  const reportExportStore = new Map<string, StoredReportExport>();
  const userNotificationStore = new Map<string, StoredUserNotification>();
  let sequence = 0;
  let historySequence = 0;
  let auditSequence = 0;
  let slaSeq = 0;
  let catSeq = 0;
  let orgSeq = 0;
  let notifTemplateSeq = 0;
  let notifDeliverySeq = 0;
  let caseNoteSeq = 0;
  let caseTaskSeq = 0;

  const seedNotificationTemplates = (): void => {
    for (const seed of NOTIFICATION_TEMPLATE_SEEDS) {
      notifTemplateSeq += 1;
      const id = `ntpl_${notifTemplateSeq}`;
      const now = new Date();
      const row: StoredNotificationTemplate = {
        id,
        ...seed,
        bodyText: seed.bodyText ?? null,
        createdAt: now,
        updatedAt: now,
      };
      notificationTemplateStore.set(
        `${seed.key}:${seed.locale}:${seed.channel}`,
        row,
      );
    }
  };
  seedNotificationTemplates();

  // ---------------------------------------------------------------------------
  // Complaint
  // ---------------------------------------------------------------------------
  const create = (args: {
    data: Omit<
      StoredComplaint,
      | 'id'
      | 'sequenceNo'
      | 'submittedAt'
      | 'priority'
      | 'categoryId'
      | 'orgUnitId'
      | 'assignedToUserId'
      | 'assignedByUserId'
      | 'assignedAt'
      | 'assignmentReason'
      | 'lastTransitionByUserId'
      | 'lastTransitionAt'
      | 'lastTransitionReason'
    > & {
      priority?: PriorityLiteral;
      categoryId?: string | null;
      orgUnitId?: string | null;
      assignedToUserId?: string | null;
      assignedByUserId?: string | null;
      assignedAt?: Date | null;
      assignmentReason?: string | null;
      lastTransitionByUserId?: string | null;
      lastTransitionAt?: Date | null;
      lastTransitionReason?: string | null;
    };
  }): StoredComplaint => {
    sequence += 1;
    const now = new Date();
    const created: StoredComplaint = {
      id: `cmp_${sequence}`,
      sequenceNo: sequence,
      referenceNo: args.data.referenceNo,
      status: args.data.status,
      priority: args.data.priority ?? 'NORMAL',
      categoryId: args.data.categoryId ?? null,
      orgUnitId: args.data.orgUnitId ?? null,
      channel: args.data.channel,
      subject: args.data.subject,
      description: args.data.description,
      submittedAt: now,
      locale: args.data.locale,
      consentGiven: args.data.consentGiven,
      complainantName: args.data.complainantName,
      complainantEmail: args.data.complainantEmail,
      complainantPhone: args.data.complainantPhone,
      assignedToUserId: args.data.assignedToUserId ?? null,
      assignedByUserId: args.data.assignedByUserId ?? null,
      assignedAt: args.data.assignedAt ?? null,
      assignmentReason: args.data.assignmentReason ?? null,
      lastTransitionByUserId: args.data.lastTransitionByUserId ?? null,
      lastTransitionAt: args.data.lastTransitionAt ?? null,
      lastTransitionReason: args.data.lastTransitionReason ?? null,
      updatedAt: now,
    };
    store.set(created.id, created);
    return created;
  };

  const update = (args: {
    where: { id: string };
    data: Partial<Omit<StoredComplaint, 'id' | 'sequenceNo' | 'submittedAt'>>;
  }): StoredComplaint => {
    const found = store.get(args.where.id);
    if (!found) {
      throw new Error('record not found');
    }
    const updated: StoredComplaint = { ...found, ...args.data };
    store.set(updated.id, updated);
    return updated;
  };

  const findUnique = (args: {
    where: { referenceNo?: string; id?: string };
  }): StoredComplaint | null => {
    for (const value of store.values()) {
      if (
        (args.where.referenceNo &&
          value.referenceNo === args.where.referenceNo) ||
        (args.where.id && value.id === args.where.id)
      ) {
        return value;
      }
    }
    return null;
  };

  type ComplaintWhere = {
    status?: StoredComplaint['status'] | { not: StoredComplaint['status'] };
    channel?: StoredComplaint['channel'];
    locale?: StoredComplaint['locale'];
    categoryId?: string;
    orgUnitId?: string;
    assignedToUserId?: string | null;
    submittedAt?: { gte?: Date; lte?: Date };
    OR?: Array<{
      assignedToUserId?: string | null;
      status?: { in: StoredComplaint['status'][] };
    }>;
  };

  const matchesComplaintWhere = (
    item: StoredComplaint,
    where: ComplaintWhere,
  ): boolean => {
    if (where.OR && where.OR.length > 0) {
      const orMatch = where.OR.some((clause) => {
        if (
          clause.assignedToUserId !== undefined &&
          item.assignedToUserId !== clause.assignedToUserId
        ) {
          return false;
        }
        if (clause.status?.in && !clause.status.in.includes(item.status)) {
          return false;
        }
        return true;
      });
      if (!orMatch) {
        return false;
      }
    } else if (
      where.assignedToUserId !== undefined &&
      item.assignedToUserId !== where.assignedToUserId
    ) {
      return false;
    }
    if (where.status) {
      if (
        typeof where.status === 'object' &&
        'not' in where.status &&
        item.status === where.status.not
      ) {
        return false;
      }
      if (typeof where.status === 'string' && item.status !== where.status) {
        return false;
      }
    }
    if (where.channel && item.channel !== where.channel) return false;
    if (where.locale && item.locale !== where.locale) return false;
    if (where.categoryId && item.categoryId !== where.categoryId) return false;
    if (where.orgUnitId && item.orgUnitId !== where.orgUnitId) return false;
    if (where.submittedAt?.gte && item.submittedAt < where.submittedAt.gte)
      return false;
    if (where.submittedAt?.lte && item.submittedAt > where.submittedAt.lte)
      return false;
    return true;
  };

  const applyWhere = (
    input: StoredComplaint[],
    where?: ComplaintWhere,
  ): StoredComplaint[] => {
    if (!where) {
      return input;
    }
    return input.filter((item) => matchesComplaintWhere(item, where));
  };

  const findMany = (args: {
    where?: ComplaintWhere;
    skip?: number;
    take?: number;
    orderBy?: { submittedAt?: 'asc' | 'desc' };
    select?: Record<string, boolean>;
  }): Promise<StoredComplaint[]> => {
    const filtered = applyWhere(Array.from(store.values()), args.where);
    const sorted = filtered.sort((a, b) => {
      if (args.orderBy?.submittedAt === 'asc') {
        return a.submittedAt.getTime() - b.submittedAt.getTime();
      }
      return b.submittedAt.getTime() - a.submittedAt.getTime();
    });
    const skip = args.skip ?? 0;
    const take = args.take ?? sorted.length;
    const slice = sorted.slice(skip, skip + take);
    if (!args.select) {
      return Promise.resolve(slice);
    }
    return Promise.resolve(
      slice.map((row) => {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(args.select ?? {})) {
          if (args.select?.[key]) {
            out[key] = row[key as keyof StoredComplaint];
          }
        }
        return out as unknown as StoredComplaint;
      }),
    );
  };

  const complaintGroupBy = (args: {
    by: ['channel'];
    where?: ComplaintWhere;
    _count: { _all: boolean };
    orderBy?: { channel: 'asc' | 'desc' };
  }): Promise<
    Array<{ channel: StoredComplaint['channel']; _count: { _all: number } }>
  > => {
    const filtered = applyWhere(Array.from(store.values()), args.where);
    const map = new Map<StoredComplaint['channel'], number>();
    for (const row of filtered) {
      map.set(row.channel, (map.get(row.channel) ?? 0) + 1);
    }
    let rows = [...map.entries()].map(([channel, count]) => ({
      channel,
      _count: { _all: count },
    }));
    if (args.orderBy?.channel === 'asc') {
      rows = rows.sort((a, b) => a.channel.localeCompare(b.channel));
    }
    return Promise.resolve(rows);
  };

  const count = (args: { where?: ComplaintWhere }): Promise<number> =>
    Promise.resolve(applyWhere(Array.from(store.values()), args.where).length);

  // ---------------------------------------------------------------------------
  // ComplaintHistory
  // ---------------------------------------------------------------------------
  const historyCreate = (args: {
    data: Omit<StoredComplaintHistory, 'id' | 'createdAt'>;
  }): StoredComplaintHistory => {
    historySequence += 1;
    const entry: StoredComplaintHistory = {
      id: `hist_${historySequence}`,
      createdAt: new Date(),
      ...args.data,
    };
    historyStore.push(entry);
    return entry;
  };

  const historyFindMany = (args: {
    where: {
      complaintId?: string | { in: string[] };
      toStatus?: StoredComplaint['status'];
    };
    orderBy?: { createdAt: 'asc' | 'desc' };
    select?: Record<string, boolean>;
  }): Promise<StoredComplaintHistory[]> => {
    let rows = [...historyStore];
    const cid = args.where.complaintId;
    if (typeof cid === 'string') {
      rows = rows.filter((item) => item.complaintId === cid);
    } else if (cid?.in) {
      rows = rows.filter((item) => cid.in.includes(item.complaintId));
    }
    if (args.where.toStatus) {
      rows = rows.filter((item) => item.toStatus === args.where.toStatus);
    }
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (!args.select) {
      return Promise.resolve(rows);
    }
    return Promise.resolve(
      rows.map((row) => {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(args.select ?? {})) {
          if (args.select?.[key]) {
            out[key] = row[key as keyof StoredComplaintHistory];
          }
        }
        return out as unknown as StoredComplaintHistory;
      }),
    );
  };

  // ---------------------------------------------------------------------------
  // Role / Permission / User seeds
  // ---------------------------------------------------------------------------
  const roleUpsert = (args: {
    where: { id: string };
    create: StoredRole;
    update: Partial<StoredRole>;
  }): Promise<StoredRole> => {
    const existing = roleStore.get(args.where.id);
    const next: StoredRole = existing
      ? { ...existing, ...args.update }
      : { ...args.create };
    roleStore.set(args.where.id, next);
    return Promise.resolve(next);
  };

  const userUpsert = (args: {
    where: { id: string };
    create: StoredUser;
    update: Partial<StoredUser>;
  }): Promise<StoredUser> => {
    const existing = userStore.get(args.where.id);
    const create = args.create as StoredUser &
      Partial<
        Pick<
          StoredUser,
          | 'passwordVersion'
          | 'mustChangePassword'
          | 'mustEnrollMfa'
          | 'mfaEnabled'
          | 'mfaMethod'
          | 'totpSecret'
          | 'totpVerifiedAt'
        >
      >;
    const baseCreate: StoredUser = {
      id: create.id,
      email: create.email,
      passwordHash: create.passwordHash,
      isActive: create.isActive,
      passwordVersion: create.passwordVersion ?? 0,
      mustChangePassword: create.mustChangePassword ?? false,
      mustEnrollMfa: create.mustEnrollMfa ?? false,
      mfaEnabled: create.mfaEnabled ?? false,
      mfaMethod: create.mfaMethod ?? null,
      totpSecret: create.totpSecret ?? null,
      totpVerifiedAt: create.totpVerifiedAt ?? null,
    };
    const next: StoredUser = existing
      ? { ...existing, ...args.update }
      : baseCreate;
    userStore.set(args.where.id, next);
    return Promise.resolve(next);
  };

  const userUpdate = (args: {
    where: { id: string };
    data: Partial<StoredUser> & {
      passwordVersion?: { increment: number };
    };
  }): Promise<StoredUser> => {
    const existing = userStore.get(args.where.id);
    if (!existing) throw new Error('record not found');
    let passwordVersion = existing.passwordVersion ?? 0;
    const incr = args.data.passwordVersion?.increment;
    if (incr !== undefined) passwordVersion += incr;
    const { passwordVersion: _ignore, ...rest } = args.data;
    void _ignore;
    const next: StoredUser = {
      ...existing,
      ...rest,
      passwordVersion:
        incr !== undefined ? passwordVersion : (existing.passwordVersion ?? 0),
    };
    userStore.set(args.where.id, next);
    return Promise.resolve(next);
  };

  const permissionUpsert = (args: {
    where: { id: string };
    create: StoredPermission;
    update: Partial<StoredPermission>;
  }): Promise<StoredPermission> => {
    const existing = permissionStore.get(args.where.id);
    const next: StoredPermission = existing
      ? { ...existing, ...args.update }
      : { ...args.create };
    permissionStore.set(args.where.id, next);
    return Promise.resolve(next);
  };

  const rolePermissionUpsert = (args: {
    where: { roleId_permissionId: { roleId: string; permissionId: string } };
    create: { roleId: string; permissionId: string };
  }): Promise<{ roleId: string; permissionId: string }> => {
    const key = `${args.where.roleId_permissionId.roleId}:${args.where.roleId_permissionId.permissionId}`;
    rolePermissionStore.add(key);
    return Promise.resolve({ ...args.create });
  };

  const userRoleUpsert = (args: {
    where: { userId_roleId: { userId: string; roleId: string } };
    create: { userId: string; roleId: string };
  }): Promise<{ userId: string; roleId: string }> => {
    const key = `${args.where.userId_roleId.userId}:${args.where.userId_roleId.roleId}`;
    userRoleStore.add(key);
    return Promise.resolve({ ...args.create });
  };

  const userFindUnique = (args: {
    where: { email?: string; id?: string };
  }): Promise<
    | (StoredUser & {
        userRoles: Array<{
          role: {
            name: string;
            rolePermissions: Array<{ permission: { code: string } }>;
          };
        }>;
      })
    | null
  > => {
    const byEmail = args.where.email
      ? Array.from(userStore.values()).find(
          (user) => user.email === args.where.email,
        )
      : undefined;
    const byId = args.where.id ? userStore.get(args.where.id) : undefined;
    const user = byEmail ?? byId;
    if (!user) return Promise.resolve(null);

    const userRoles = Array.from(userRoleStore)
      .map((entry) => entry.split(':'))
      .filter(([userId]) => userId === user.id)
      .map(([, roleId]) => ({
        role: {
          name: roleStore.get(roleId)?.name ?? roleId,
          rolePermissions: Array.from(rolePermissionStore)
            .map((entry) => entry.split(':'))
            .filter(([mappedRoleId]) => mappedRoleId === roleId)
            .map(([, permissionId]) => ({
              permission: {
                code: permissionStore.get(permissionId)?.code ?? permissionId,
              },
            })),
        },
      }));

    return Promise.resolve({ ...user, userRoles });
  };

  const buildUserWithRoles = (
    user: StoredUser,
  ): StoredUser & {
    userRoles: Array<{ role: { id: string; name: string } }>;
  } => ({
    ...user,
    userRoles: Array.from(userRoleStore)
      .map((entry) => entry.split(':'))
      .filter(([userId]) => userId === user.id)
      .map(([, roleId]) => {
        const role = roleStore.get(roleId);
        return {
          role: {
            id: roleId,
            name: role?.name ?? roleId,
          },
        };
      }),
  });

  const userFindMany = (args: {
    where?: {
      email?: { contains: string; mode?: string };
      isActive?: boolean;
    };
    skip?: number;
    take?: number;
  }): Promise<
    Array<
      StoredUser & {
        userRoles: Array<{ role: { id: string; name: string } }>;
      }
    >
  > => {
    let users = Array.from(userStore.values());
    if (args.where?.isActive !== undefined) {
      users = users.filter((row) => row.isActive === args.where?.isActive);
    }
    if (args.where?.email?.contains) {
      const needle = args.where.email.contains.toLowerCase();
      users = users.filter((row) => row.email.toLowerCase().includes(needle));
    }
    users.sort((a, b) => a.email.localeCompare(b.email));
    const skip = args.skip ?? 0;
    const take = args.take ?? users.length;
    return Promise.resolve(
      users.slice(skip, skip + take).map((user) => buildUserWithRoles(user)),
    );
  };

  const userCount = (args: {
    where?: {
      email?: { contains: string; mode?: string };
      isActive?: boolean;
    };
  }): Promise<number> => {
    let users = Array.from(userStore.values());
    if (args.where?.isActive !== undefined) {
      users = users.filter((row) => row.isActive === args.where?.isActive);
    }
    if (args.where?.email?.contains) {
      const needle = args.where.email.contains.toLowerCase();
      users = users.filter((row) => row.email.toLowerCase().includes(needle));
    }
    return Promise.resolve(users.length);
  };

  // ---------------------------------------------------------------------------
  // AuditLog
  // ---------------------------------------------------------------------------
  const auditLogCreate = (args: {
    data: Omit<StoredAuditLog, 'id' | 'createdAt'>;
  }): Promise<StoredAuditLog> => {
    auditSequence += 1;
    const entry: StoredAuditLog = {
      id: `audit_${auditSequence}`,
      createdAt: new Date(),
      ...args.data,
    };
    auditLogStore.push(entry);
    return Promise.resolve(entry);
  };

  const matchesAuditLogWhere = (
    entry: StoredAuditLog,
    where: Record<string, unknown> | undefined,
  ): boolean => {
    if (!where || Object.keys(where).length === 0) {
      return true;
    }
    const and = where.AND as Array<Record<string, unknown>> | undefined;
    if (!and) {
      return true;
    }
    return and.every((clause) => {
      if ('eventType' in clause && clause.eventType !== entry.eventType) {
        return false;
      }
      if ('actorUserId' in clause && clause.actorUserId !== entry.actorUserId) {
        return false;
      }
      if ('entityType' in clause && clause.entityType !== entry.entityType) {
        return false;
      }
      if ('entityId' in clause && clause.entityId !== entry.entityId) {
        return false;
      }
      if ('createdAt' in clause) {
        const createdAt = clause.createdAt as {
          gte?: Date;
          lte?: Date;
          lt?: Date;
        };
        if (
          createdAt.gte &&
          entry.createdAt.getTime() < createdAt.gte.getTime()
        ) {
          return false;
        }
        if (
          createdAt.lte &&
          entry.createdAt.getTime() > createdAt.lte.getTime()
        ) {
          return false;
        }
        if (
          createdAt.lt &&
          entry.createdAt.getTime() >= createdAt.lt.getTime()
        ) {
          return false;
        }
      }
      if ('OR' in clause) {
        const orClauses = clause.OR as Array<Record<string, unknown>>;
        return orClauses.some((orClause) => {
          const createdAt = orClause.createdAt as Date | { lt?: Date };
          if (createdAt instanceof Date) {
            return (
              entry.createdAt.getTime() === createdAt.getTime() &&
              typeof orClause.id === 'object' &&
              orClause.id !== null &&
              'lt' in orClause.id &&
              entry.id < (orClause.id as { lt: string }).lt
            );
          }
          if (
            typeof createdAt === 'object' &&
            createdAt !== null &&
            'lt' in createdAt &&
            createdAt.lt instanceof Date
          ) {
            return entry.createdAt.getTime() < createdAt.lt.getTime();
          }
          return false;
        });
      }
      return true;
    });
  };

  const auditLogFindMany = (args?: {
    where?: Record<string, unknown>;
    orderBy?: Array<{ createdAt?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
    take?: number;
  }): Promise<StoredAuditLog[]> => {
    let rows = auditLogStore.filter((entry) =>
      matchesAuditLogWhere(entry, args?.where),
    );
    rows.sort((a, b) => {
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return b.id.localeCompare(a.id);
    });
    if (args?.take !== undefined) {
      rows = rows.slice(0, args.take);
    }
    return Promise.resolve(rows.map((row) => ({ ...row })));
  };

  // ---------------------------------------------------------------------------
  // SlaConfig
  // ---------------------------------------------------------------------------
  const slaConfigCreate = (args: {
    data: Omit<StoredSlaConfig, 'id' | 'createdAt' | 'updatedAt'>;
  }): Promise<StoredSlaConfig> => {
    slaSeq += 1;
    const now = new Date();
    const entry: StoredSlaConfig = {
      id: `sla_cfg_${slaSeq}`,
      createdAt: now,
      updatedAt: now,
      ...args.data,
    };
    slaConfigStore.set(entry.id, entry);
    return Promise.resolve(entry);
  };

  const slaConfigFindFirst = (args: {
    where: {
      priority?: PriorityLiteral;
      categoryId?: string | null;
      isActive?: boolean;
    };
    orderBy?: { categoryId?: 'asc' | 'desc' | null };
  }): Promise<StoredSlaConfig | null> => {
    let candidates = Array.from(slaConfigStore.values());
    if (args.where.priority !== undefined)
      candidates = candidates.filter((c) => c.priority === args.where.priority);
    if (args.where.isActive !== undefined)
      candidates = candidates.filter((c) => c.isActive === args.where.isActive);
    if ('categoryId' in args.where)
      candidates = candidates.filter(
        (c) => c.categoryId === args.where.categoryId,
      );
    return Promise.resolve(candidates[0] ?? null);
  };

  const slaConfigFindMany = (args?: {
    where?: { isActive?: boolean; priority?: PriorityLiteral };
    orderBy?: unknown;
  }): Promise<StoredSlaConfig[]> => {
    let all = Array.from(slaConfigStore.values());
    if (args?.where?.isActive !== undefined)
      all = all.filter((c) => c.isActive === args.where!.isActive);
    if (args?.where?.priority !== undefined)
      all = all.filter((c) => c.priority === args.where!.priority);
    return Promise.resolve(all);
  };

  const slaConfigUpsert = (args: {
    where: {
      priority_categoryId: {
        priority: PriorityLiteral;
        categoryId: string | null;
      };
    };
    create: Omit<StoredSlaConfig, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<Omit<StoredSlaConfig, 'id' | 'createdAt'>>;
  }): Promise<StoredSlaConfig> => {
    const existing = Array.from(slaConfigStore.values()).find(
      (c) =>
        c.priority === args.where.priority_categoryId.priority &&
        c.categoryId === args.where.priority_categoryId.categoryId,
    );
    if (existing) {
      const updated: StoredSlaConfig = {
        ...existing,
        ...args.update,
        updatedAt: new Date(),
      };
      slaConfigStore.set(existing.id, updated);
      return Promise.resolve(updated);
    }
    return slaConfigCreate({ data: args.create });
  };

  const slaConfigUpdate = (args: {
    where: { id: string };
    data: Partial<Omit<StoredSlaConfig, 'id' | 'createdAt'>>;
  }): Promise<StoredSlaConfig> => {
    const existing = slaConfigStore.get(args.where.id);
    if (!existing) throw new Error('SlaConfig not found');
    const updated: StoredSlaConfig = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    slaConfigStore.set(existing.id, updated);
    return Promise.resolve(updated);
  };

  const slaConfigFindUniqueOrThrow = (args: {
    where: { id: string };
  }): Promise<StoredSlaConfig> => {
    const found = slaConfigStore.get(args.where.id);
    if (!found) throw new Error('SlaConfig not found');
    return Promise.resolve(found);
  };

  // ---------------------------------------------------------------------------
  // ComplaintSla
  // ---------------------------------------------------------------------------
  const complaintSlaCreate = (args: {
    data: Omit<StoredComplaintSla, 'id' | 'createdAt' | 'updatedAt'>;
  }): Promise<StoredComplaintSla> => {
    const now = new Date();
    const entry: StoredComplaintSla = {
      id: `csla_${complaintSlaStore.size + 1}`,
      createdAt: now,
      updatedAt: now,
      ...args.data,
      warnedAt: args.data.warnedAt ?? null,
      breachedAt: args.data.breachedAt ?? null,
      completedAt: args.data.completedAt ?? null,
    };
    complaintSlaStore.set(entry.complaintId, entry);
    return Promise.resolve(entry);
  };

  const complaintSlaFindUnique = (args: {
    where: { complaintId?: string; id?: string };
    include?: { slaConfig?: boolean };
  }): Promise<
    (StoredComplaintSla & { slaConfig?: StoredSlaConfig }) | null
  > => {
    let found: StoredComplaintSla | undefined;
    if (args.where.complaintId)
      found = complaintSlaStore.get(args.where.complaintId);
    else if (args.where.id)
      found = Array.from(complaintSlaStore.values()).find(
        (s) => s.id === args.where.id,
      );
    if (!found) return Promise.resolve(null);
    if (args.include?.slaConfig) {
      const slaConfig = slaConfigStore.get(found.slaConfigId);
      return Promise.resolve({ ...found, slaConfig });
    }
    return Promise.resolve(found);
  };

  const complaintSlaFindMany = (args: {
    where?: {
      status?: SlaStatusLiteral;
      startedAt?: { gte?: Date; lte?: Date };
      complaint?: ComplaintWhere;
    };
    include?: { slaConfig?: boolean };
    select?: Record<string, boolean>;
  }): Promise<(StoredComplaintSla & { slaConfig?: StoredSlaConfig })[]> => {
    let all = Array.from(complaintSlaStore.values());
    if (args.where?.status) {
      all = all.filter((s) => s.status === args.where!.status);
    }
    if (args.where?.startedAt?.gte) {
      all = all.filter((s) => s.startedAt >= args.where!.startedAt!.gte!);
    }
    if (args.where?.startedAt?.lte) {
      all = all.filter((s) => s.startedAt <= args.where!.startedAt!.lte!);
    }
    if (args.where?.complaint) {
      const allowedIds = new Set(
        applyWhere(Array.from(store.values()), args.where.complaint).map(
          (c) => c.id,
        ),
      );
      all = all.filter((s) => allowedIds.has(s.complaintId));
    }
    if (args.include?.slaConfig) {
      return Promise.resolve(
        all.map((s) => ({
          ...s,
          slaConfig: slaConfigStore.get(s.slaConfigId),
        })),
      );
    }
    return Promise.resolve(all);
  };

  const complaintSlaUpdateMany = (args: {
    where: {
      id?: string;
      complaintId?: string;
      warnedAt?: null;
      breachedAt?: null;
    };
    data: Partial<Omit<StoredComplaintSla, 'id' | 'createdAt'>>;
  }): Promise<{ count: number }> => {
    let count = 0;
    for (const [key, entry] of complaintSlaStore.entries()) {
      const idMatch = args.where.id ? entry.id === args.where.id : true;
      const cidMatch = args.where.complaintId
        ? entry.complaintId === args.where.complaintId
        : true;
      const warnedMatch =
        args.where.warnedAt === null ? entry.warnedAt === null : true;
      const breachedMatch =
        args.where.breachedAt === null ? entry.breachedAt === null : true;
      if (idMatch && cidMatch && warnedMatch && breachedMatch) {
        complaintSlaStore.set(key, {
          ...entry,
          ...args.data,
          updatedAt: new Date(),
        });
        count++;
      }
    }
    return Promise.resolve({ count });
  };

  const complaintSlaUpdate = (args: {
    where: { complaintId?: string; id?: string };
    data: Partial<Omit<StoredComplaintSla, 'id' | 'createdAt'>>;
  }): Promise<StoredComplaintSla> => {
    let found: StoredComplaintSla | undefined;
    if (args.where.complaintId)
      found = complaintSlaStore.get(args.where.complaintId);
    else if (args.where.id)
      found = Array.from(complaintSlaStore.values()).find(
        (s) => s.id === args.where.id,
      );
    if (!found) throw new Error('ComplaintSla not found');
    const updated: StoredComplaintSla = {
      ...found,
      ...args.data,
      updatedAt: new Date(),
    };
    complaintSlaStore.set(found.complaintId, updated);
    return Promise.resolve(updated);
  };

  // ---------------------------------------------------------------------------
  // ComplaintCategory
  // ---------------------------------------------------------------------------
  const categoryCreate = (args: {
    data: Omit<StoredComplaintCategory, 'id' | 'createdAt' | 'updatedAt'>;
  }): Promise<StoredComplaintCategory> => {
    const dup = Array.from(categoryStore.values()).find(
      (c) => c.code === args.data.code,
    );
    if (dup) {
      const err = new Error('Unique constraint failed') as Error & {
        code: string;
      };
      err.code = 'P2002';
      throw err;
    }
    catSeq += 1;
    const now = new Date();
    const entry: StoredComplaintCategory = {
      id: `cat_${catSeq}`,
      createdAt: now,
      updatedAt: now,
      ...args.data,
      isActive: args.data.isActive ?? true,
      sortOrder: args.data.sortOrder ?? 0,
    };
    categoryStore.set(entry.id, entry);
    return Promise.resolve(entry);
  };

  const categoryFindUnique = (args: {
    where: { id?: string; code?: string };
  }): Promise<StoredComplaintCategory | null> => {
    if (args.where.id)
      return Promise.resolve(categoryStore.get(args.where.id) ?? null);
    if (args.where.code) {
      const found = Array.from(categoryStore.values()).find(
        (c) => c.code === args.where.code,
      );
      return Promise.resolve(found ?? null);
    }
    return Promise.resolve(null);
  };

  const categoryFindUniqueOrThrow = (args: {
    where: { id: string };
  }): Promise<StoredComplaintCategory> => {
    const found = categoryStore.get(args.where.id);
    if (!found) throw new Error('ComplaintCategory not found');
    return Promise.resolve(found);
  };

  const categoryFindMany = (args?: {
    where?: { isActive?: boolean };
    orderBy?: unknown;
  }): Promise<StoredComplaintCategory[]> => {
    let all = Array.from(categoryStore.values());
    if (args?.where?.isActive !== undefined)
      all = all.filter((c) => c.isActive === args.where!.isActive);
    all.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
    );
    return Promise.resolve(all);
  };

  const categoryUpdate = (args: {
    where: { id: string };
    data: Partial<Omit<StoredComplaintCategory, 'id' | 'createdAt'>>;
  }): Promise<StoredComplaintCategory> => {
    const existing = categoryStore.get(args.where.id);
    if (!existing) throw new Error('ComplaintCategory not found');
    const updated: StoredComplaintCategory = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    categoryStore.set(existing.id, updated);
    return Promise.resolve(updated);
  };

  // ---------------------------------------------------------------------------
  // OrgUnit
  // ---------------------------------------------------------------------------
  const orgUnitCreate = (args: {
    data: Omit<StoredOrgUnit, 'id' | 'createdAt' | 'updatedAt'>;
  }): Promise<StoredOrgUnit> => {
    const dup = Array.from(orgUnitStore.values()).find(
      (u) => u.code === args.data.code,
    );
    if (dup) {
      const err = new Error('Unique constraint failed') as Error & {
        code: string;
      };
      err.code = 'P2002';
      throw err;
    }
    orgSeq += 1;
    const now = new Date();
    const entry: StoredOrgUnit = {
      id: `org_${orgSeq}`,
      createdAt: now,
      updatedAt: now,
      ...args.data,
      isActive: args.data.isActive ?? true,
      sortOrder: args.data.sortOrder ?? 0,
    };
    orgUnitStore.set(entry.id, entry);
    return Promise.resolve(entry);
  };

  const orgUnitFindUnique = (args: {
    where: { id?: string; code?: string };
  }): Promise<StoredOrgUnit | null> => {
    if (args.where.id)
      return Promise.resolve(orgUnitStore.get(args.where.id) ?? null);
    if (args.where.code) {
      const found = Array.from(orgUnitStore.values()).find(
        (u) => u.code === args.where.code,
      );
      return Promise.resolve(found ?? null);
    }
    return Promise.resolve(null);
  };

  const orgUnitFindUniqueOrThrow = (args: {
    where: { id: string };
  }): Promise<StoredOrgUnit> => {
    const found = orgUnitStore.get(args.where.id);
    if (!found) throw new Error('OrgUnit not found');
    return Promise.resolve(found);
  };

  const orgUnitFindMany = (args?: {
    where?: { isActive?: boolean };
    orderBy?: unknown;
  }): Promise<StoredOrgUnit[]> => {
    let all = Array.from(orgUnitStore.values());
    if (args?.where?.isActive !== undefined)
      all = all.filter((u) => u.isActive === args.where!.isActive);
    all.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
    );
    return Promise.resolve(all);
  };

  const orgUnitUpdate = (args: {
    where: { id: string };
    data: Partial<Omit<StoredOrgUnit, 'id' | 'createdAt'>>;
  }): Promise<StoredOrgUnit> => {
    const existing = orgUnitStore.get(args.where.id);
    if (!existing) throw new Error('OrgUnit not found');
    const updated: StoredOrgUnit = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    orgUnitStore.set(existing.id, updated);
    return Promise.resolve(updated);
  };

  /** Active category + org unit for GET /complaints/form-options in public E2E. */
  const seedPublicFormOptionsReferenceData = (): void => {
    const now = new Date();
    catSeq += 1;
    const categoryId = `cat_${catSeq}`;
    categoryStore.set(categoryId, {
      id: categoryId,
      code: 'E2E_PUBLIC_CAT',
      nameEn: 'E2E Public Category',
      nameAm: null,
      parentId: null,
      isActive: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
    orgSeq += 1;
    const orgUnitId = `org_${orgSeq}`;
    orgUnitStore.set(orgUnitId, {
      id: orgUnitId,
      code: 'E2E_PUBLIC_ORG',
      nameEn: 'E2E Public Org Unit',
      nameAm: null,
      parentId: null,
      isActive: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  };
  seedPublicFormOptionsReferenceData();

  const notificationTemplateUpsert = (args: {
    where: {
      key_locale_channel: { key: string; locale: string; channel: string };
    };
    create: Omit<StoredNotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<
      Omit<StoredNotificationTemplate, 'id' | 'key' | 'locale' | 'channel'>
    >;
  }): Promise<StoredNotificationTemplate> => {
    const mapKey = `${args.where.key_locale_channel.key}:${args.where.key_locale_channel.locale}:${args.where.key_locale_channel.channel}`;
    const existing = notificationTemplateStore.get(mapKey);
    const now = new Date();
    if (existing) {
      const updated: StoredNotificationTemplate = {
        ...existing,
        ...args.update,
        updatedAt: now,
      };
      notificationTemplateStore.set(mapKey, updated);
      return Promise.resolve(updated);
    }
    notifTemplateSeq += 1;
    const created: StoredNotificationTemplate = {
      id: `ntpl_${notifTemplateSeq}`,
      key: args.create.key,
      locale: args.create.locale,
      channel: args.create.channel,
      subject: args.create.subject,
      bodyHtml: args.create.bodyHtml,
      bodyText: args.create.bodyText ?? null,
      createdAt: now,
      updatedAt: now,
    };
    notificationTemplateStore.set(mapKey, created);
    return Promise.resolve(created);
  };

  const notificationTemplateFindUnique = (args: {
    where:
      | { id: string }
      | {
          key_locale_channel: {
            key: string;
            locale: string;
            channel: string;
          };
        };
  }): Promise<StoredNotificationTemplate | null> => {
    if ('id' in args.where) {
      for (const row of notificationTemplateStore.values()) {
        if (row.id === args.where.id) {
          return Promise.resolve(row);
        }
      }
      return Promise.resolve(null);
    }
    const w = args.where.key_locale_channel;
    const mapKey = `${w.key}:${w.locale}:${w.channel}`;
    return Promise.resolve(notificationTemplateStore.get(mapKey) ?? null);
  };

  const notificationTemplateCreate = (args: {
    data: Omit<StoredNotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>;
  }): Promise<StoredNotificationTemplate> => {
    const mapKey = `${args.data.key}:${args.data.locale}:${args.data.channel}`;
    if (notificationTemplateStore.has(mapKey)) {
      return Promise.reject(
        Object.assign(new Error('Unique violation'), { code: 'P2002' }),
      );
    }
    notifTemplateSeq += 1;
    const now = new Date();
    const row: StoredNotificationTemplate = {
      id: `ntpl_${notifTemplateSeq}`,
      key: args.data.key,
      locale: args.data.locale,
      channel: args.data.channel,
      subject: args.data.subject,
      bodyHtml: args.data.bodyHtml,
      bodyText: args.data.bodyText ?? null,
      createdAt: now,
      updatedAt: now,
    };
    notificationTemplateStore.set(mapKey, row);
    return Promise.resolve(row);
  };

  const notificationTemplateUpdate = (args: {
    where: { id: string };
    data: Partial<
      Pick<StoredNotificationTemplate, 'subject' | 'bodyHtml' | 'bodyText'>
    >;
  }): Promise<StoredNotificationTemplate> => {
    let foundKey: string | undefined;
    let found: StoredNotificationTemplate | undefined;
    for (const [k, v] of notificationTemplateStore.entries()) {
      if (v.id === args.where.id) {
        foundKey = k;
        found = v;
        break;
      }
    }
    if (!found || !foundKey) {
      throw new Error('NotificationTemplate not found');
    }
    const updated: StoredNotificationTemplate = {
      ...found,
      ...args.data,
      updatedAt: new Date(),
    };
    notificationTemplateStore.set(foundKey, updated);
    return Promise.resolve(updated);
  };

  const notificationTemplateFindMany = (args: {
    orderBy?: Array<Record<string, 'asc' | 'desc'>>;
    skip?: number;
    take?: number;
  }): Promise<StoredNotificationTemplate[]> => {
    const rows = [...notificationTemplateStore.values()].sort((a, b) => {
      if (a.key !== b.key) return a.key.localeCompare(b.key);
      return a.locale.localeCompare(b.locale);
    });
    const skip = args.skip ?? 0;
    const take = args.take ?? rows.length;
    return Promise.resolve(rows.slice(skip, skip + take));
  };

  const notificationTemplateCount = (): Promise<number> =>
    Promise.resolve(notificationTemplateStore.size);

  const notificationDeliveryCreate = (args: {
    data: Omit<
      StoredNotificationDelivery,
      'id' | 'createdAt' | 'updatedAt' | 'retries' | 'lastError' | 'sentAt'
    > & {
      retries?: number;
      lastError?: string | null;
      sentAt?: Date | null;
    };
  }): Promise<StoredNotificationDelivery> => {
    notifDeliverySeq += 1;
    const now = new Date();
    const row: StoredNotificationDelivery = {
      id: `ndlv_${notifDeliverySeq}`,
      templateKey: args.data.templateKey,
      to: args.data.to,
      channel: args.data.channel,
      status: args.data.status,
      retries: args.data.retries ?? 0,
      lastError: args.data.lastError ?? null,
      sentAt: args.data.sentAt ?? null,
      correlationId: args.data.correlationId ?? null,
      payload: args.data.payload,
      createdAt: now,
      updatedAt: now,
    };
    notificationDeliveryStore.set(row.id, row);
    return Promise.resolve(row);
  };

  const notificationDeliveryFindUnique = (args: {
    where: { id: string };
  }): Promise<StoredNotificationDelivery | null> =>
    Promise.resolve(notificationDeliveryStore.get(args.where.id) ?? null);

  const notificationDeliveryUpdate = (args: {
    where: { id: string };
    data: Partial<
      Omit<
        StoredNotificationDelivery,
        'id' | 'createdAt' | 'templateKey' | 'to'
      >
    >;
  }): Promise<StoredNotificationDelivery> => {
    const existing = notificationDeliveryStore.get(args.where.id);
    if (!existing) throw new Error('NotificationDelivery not found');
    const updated: StoredNotificationDelivery = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    notificationDeliveryStore.set(existing.id, updated);
    return Promise.resolve(updated);
  };

  const notificationDeliveryFindMany = (args: {
    where?: {
      status?: StoredNotificationDelivery['status'];
      to?: string;
      templateKey?: string;
    };
    orderBy?: Array<Record<string, 'asc' | 'desc'>>;
    skip?: number;
    take?: number;
  }): Promise<StoredNotificationDelivery[]> => {
    let rows = [...notificationDeliveryStore.values()];
    if (args.where?.status) {
      rows = rows.filter((r) => r.status === args.where!.status);
    }
    if (args.where?.to) {
      rows = rows.filter((r) => r.to === args.where!.to);
    }
    if (args.where?.templateKey) {
      rows = rows.filter((r) => r.templateKey === args.where!.templateKey);
    }
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const skip = args.skip ?? 0;
    const take = args.take ?? rows.length;
    return Promise.resolve(rows.slice(skip, skip + take));
  };

  const notificationDeliveryCount = (args: {
    where?: {
      status?: StoredNotificationDelivery['status'];
      to?: string;
      templateKey?: string;
    };
  }): Promise<number> => {
    let rows = [...notificationDeliveryStore.values()];
    if (args.where?.status) {
      rows = rows.filter((r) => r.status === args.where!.status);
    }
    if (args.where?.to) {
      rows = rows.filter((r) => r.to === args.where!.to);
    }
    if (args.where?.templateKey) {
      rows = rows.filter((r) => r.templateKey === args.where!.templateKey);
    }
    return Promise.resolve(rows.length);
  };

  // ---------------------------------------------------------------------------
  // CaseNote / CaseTask
  // ---------------------------------------------------------------------------
  const caseNoteCreate = (args: {
    data: Omit<StoredCaseNote, 'id' | 'createdAt'>;
  }): Promise<StoredCaseNote> => {
    caseNoteSeq += 1;
    const row: StoredCaseNote = {
      ...args.data,
      id: `case_note_${caseNoteSeq}`,
      createdAt: new Date(),
      visibility: args.data.visibility ?? 'INTERNAL',
    };
    caseNoteStore.set(row.id, row);
    return Promise.resolve(row);
  };

  const caseNoteFindMany = (args: {
    where: { complaintId: string };
    orderBy?: { createdAt: 'asc' | 'desc' };
    take?: number;
  }): Promise<StoredCaseNote[]> => {
    let rows = [...caseNoteStore.values()].filter(
      (r) => r.complaintId === args.where.complaintId,
    );
    if (args.orderBy?.createdAt === 'desc') {
      rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (args.orderBy?.createdAt === 'asc') {
      rows = rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    if (args.take !== undefined) {
      rows = rows.slice(0, args.take);
    }
    return Promise.resolve(rows);
  };

  const caseTaskCreate = (args: {
    data: Omit<StoredCaseTask, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: StoredCaseTask['status'];
    };
  }): Promise<StoredCaseTask> => {
    caseTaskSeq += 1;
    const now = new Date();
    const row: StoredCaseTask = {
      id: `case_task_${caseTaskSeq}`,
      status: args.data.status ?? 'OPEN',
      createdAt: now,
      updatedAt: now,
      dueAt: args.data.dueAt ?? null,
      complaintId: args.data.complaintId,
      assigneeId: args.data.assigneeId,
      createdById: args.data.createdById,
      title: args.data.title,
    };
    caseTaskStore.set(row.id, row);
    return Promise.resolve(row);
  };

  const caseTaskFindMany = (args: {
    where: { complaintId: string };
    orderBy?: Array<{ status: 'asc' | 'desc' } | { dueAt: 'asc' | 'desc' }>;
    take?: number;
  }): Promise<StoredCaseTask[]> => {
    let rows = [...caseTaskStore.values()].filter(
      (r) => r.complaintId === args.where.complaintId,
    );
    if (args.orderBy) {
      for (const clause of [...args.orderBy].reverse()) {
        if ('status' in clause) {
          const dir = clause.status === 'desc' ? -1 : 1;
          rows = rows.sort((a, b) => (a.status < b.status ? -dir : dir));
        }
        if ('dueAt' in clause) {
          const dir = clause.dueAt === 'desc' ? -1 : 1;
          rows = rows.sort((a, b) => {
            const at = a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const bt = b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return (at - bt) * dir;
          });
        }
      }
    }
    if (args.take !== undefined) {
      rows = rows.slice(0, args.take);
    }
    return Promise.resolve(rows);
  };

  const caseTaskFindFirst = (args: {
    where: { id: string; complaintId: string };
  }): Promise<StoredCaseTask | null> => {
    const row = caseTaskStore.get(args.where.id);
    if (!row || row.complaintId !== args.where.complaintId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(row);
  };

  const caseTaskUpdate = (args: {
    where: { id: string };
    data: Partial<
      Pick<StoredCaseTask, 'status' | 'title' | 'assigneeId' | 'dueAt'>
    >;
  }): Promise<StoredCaseTask> => {
    const existing = caseTaskStore.get(args.where.id);
    if (!existing) throw new Error('record not found');
    const updated: StoredCaseTask = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    caseTaskStore.set(updated.id, updated);
    return Promise.resolve(updated);
  };

  // ---------------------------------------------------------------------------
  // Document
  // ---------------------------------------------------------------------------
  const documentCreate = (args: {
    data: Omit<StoredDocument, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    };
  }): Promise<StoredDocument> => {
    const now = new Date();
    const row: StoredDocument = {
      ...args.data,
      quarantineKey: args.data.quarantineKey ?? null,
      liveKey: args.data.liveKey ?? null,
      scanError: args.data.scanError ?? null,
      scannedAt: args.data.scannedAt ?? null,
      createdAt: args.data.createdAt ?? now,
      updatedAt: args.data.updatedAt ?? now,
    };
    documentStore.set(row.id, row);
    return Promise.resolve(row);
  };

  const documentFindUnique = (args: {
    where: { id: string };
  }): Promise<StoredDocument | null> =>
    Promise.resolve(documentStore.get(args.where.id) ?? null);

  const documentUpdate = (args: {
    where: { id: string };
    data: Partial<
      Omit<StoredDocument, 'id' | 'complaintId' | 'ownerUserId' | 'createdAt'>
    >;
  }): Promise<StoredDocument> => {
    const existing = documentStore.get(args.where.id);
    if (!existing) throw new Error('Document not found');
    const updated: StoredDocument = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    documentStore.set(updated.id, updated);
    return Promise.resolve(updated);
  };

  const documentDelete = (args: {
    where: { id: string };
  }): Promise<StoredDocument> => {
    const existing = documentStore.get(args.where.id);
    if (!existing) throw new Error('Document not found');
    documentStore.delete(args.where.id);
    return Promise.resolve(existing);
  };

  // ---------------------------------------------------------------------------
  // ReportExport
  // ---------------------------------------------------------------------------
  const reportExportCreate = (args: {
    data: Omit<StoredReportExport, 'id' | 'createdAt' | 'completedAt'> & {
      id?: string;
    };
  }): Promise<StoredReportExport> => {
    const row: StoredReportExport = {
      id: args.data.id ?? randomUUID(),
      requestedById: args.data.requestedById,
      format: args.data.format,
      status: args.data.status,
      filters: args.data.filters,
      storageKey: args.data.storageKey ?? null,
      mimeType: args.data.mimeType ?? null,
      rowCount: args.data.rowCount ?? null,
      errorMessage: args.data.errorMessage ?? null,
      expiresAt: args.data.expiresAt ?? null,
      createdAt: new Date(),
      completedAt: null,
    };
    reportExportStore.set(row.id, row);
    return Promise.resolve(row);
  };

  const reportExportFindUnique = (args: {
    where: { id: string };
  }): Promise<StoredReportExport | null> =>
    Promise.resolve(reportExportStore.get(args.where.id) ?? null);

  const reportExportUpdate = (args: {
    where: { id: string };
    data: Partial<
      Omit<StoredReportExport, 'id' | 'requestedById' | 'createdAt'>
    >;
  }): Promise<StoredReportExport> => {
    const existing = reportExportStore.get(args.where.id);
    if (!existing) {
      throw new Error('ReportExport not found');
    }
    const updated = { ...existing, ...args.data };
    reportExportStore.set(updated.id, updated);
    return Promise.resolve(updated);
  };

  // ---------------------------------------------------------------------------
  // UserNotification
  // ---------------------------------------------------------------------------
  const findUserNotificationByDedup = (
    userId: string,
    dedupKey: string,
  ): StoredUserNotification | undefined => {
    for (const row of userNotificationStore.values()) {
      if (row.userId === userId && row.dedupKey === dedupKey) {
        return row;
      }
    }
    return undefined;
  };

  const userNotificationCreate = (args: {
    data: Omit<StoredUserNotification, 'id' | 'createdAt' | 'readAt'> & {
      readAt?: Date | null;
    };
  }): Promise<StoredUserNotification> => {
    const row: StoredUserNotification = {
      id: randomUUID(),
      readAt: args.data.readAt ?? null,
      createdAt: new Date(),
      userId: args.data.userId,
      type: args.data.type,
      severity: args.data.severity,
      messageKey: args.data.messageKey,
      messageParams: args.data.messageParams ?? null,
      link: args.data.link ?? null,
      entityType: args.data.entityType ?? null,
      entityId: args.data.entityId ?? null,
      dedupKey: args.data.dedupKey ?? null,
    };
    userNotificationStore.set(row.id, row);
    return Promise.resolve(row);
  };

  const userNotificationUpsert = (args: {
    where: { userId_dedupKey: { userId: string; dedupKey: string } };
    create: Omit<StoredUserNotification, 'id' | 'createdAt' | 'readAt'> & {
      readAt?: Date | null;
    };
    update: Partial<
      Omit<StoredUserNotification, 'id' | 'userId' | 'dedupKey' | 'createdAt'>
    >;
  }): Promise<StoredUserNotification> => {
    const { userId, dedupKey } = args.where.userId_dedupKey;
    const existing = findUserNotificationByDedup(userId, dedupKey);
    if (existing) {
      const updated: StoredUserNotification = {
        ...existing,
        ...args.update,
      };
      userNotificationStore.set(updated.id, updated);
      return Promise.resolve(updated);
    }
    return userNotificationCreate({ data: args.create });
  };

  const userNotificationFindMany = (args: {
    where?: {
      userId?: string;
      readAt?: Date | null;
    };
    orderBy?: { createdAt: 'desc' | 'asc' };
    skip?: number;
    take?: number;
  }): Promise<StoredUserNotification[]> => {
    let rows = [...userNotificationStore.values()];
    if (args.where?.userId) {
      rows = rows.filter((r) => r.userId === args.where!.userId);
    }
    if (args.where && 'readAt' in args.where) {
      const readAt = args.where.readAt;
      rows = rows.filter((r) =>
        readAt === null ? r.readAt === null : r.readAt !== null,
      );
    }
    if (args.orderBy?.createdAt === 'desc') {
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args.skip ?? 0;
    const take = args.take ?? rows.length;
    return Promise.resolve(rows.slice(skip, skip + take));
  };

  const userNotificationCount = (args: {
    where?: {
      userId?: string;
      readAt?: Date | null;
    };
  }): Promise<number> => {
    let rows = [...userNotificationStore.values()];
    if (args.where?.userId) {
      rows = rows.filter((r) => r.userId === args.where!.userId);
    }
    if (args.where && 'readAt' in args.where) {
      const readAt = args.where.readAt;
      rows = rows.filter((r) =>
        readAt === null ? r.readAt === null : r.readAt !== null,
      );
    }
    return Promise.resolve(rows.length);
  };

  const userNotificationFindFirst = (args: {
    where: { id?: string; userId?: string };
  }): Promise<StoredUserNotification | null> => {
    for (const row of userNotificationStore.values()) {
      if (args.where.id && row.id !== args.where.id) continue;
      if (args.where.userId && row.userId !== args.where.userId) continue;
      return Promise.resolve(row);
    }
    return Promise.resolve(null);
  };

  const userNotificationUpdate = (args: {
    where: { id: string };
    data: Partial<Pick<StoredUserNotification, 'readAt'>>;
  }): Promise<StoredUserNotification> => {
    const existing = userNotificationStore.get(args.where.id);
    if (!existing) {
      throw new Error('UserNotification not found');
    }
    const updated = { ...existing, ...args.data };
    userNotificationStore.set(updated.id, updated);
    return Promise.resolve(updated);
  };

  const userNotificationUpdateMany = (args: {
    where: { userId: string; readAt?: Date | null };
    data: Partial<Pick<StoredUserNotification, 'readAt'>>;
  }): Promise<{ count: number }> => {
    let count = 0;
    for (const [id, row] of userNotificationStore.entries()) {
      if (row.userId !== args.where.userId) continue;
      if ('readAt' in args.where && row.readAt !== args.where.readAt) {
        continue;
      }
      userNotificationStore.set(id, { ...row, ...args.data });
      count += 1;
    }
    return Promise.resolve({ count });
  };

  // ---------------------------------------------------------------------------
  // Assembled mock
  // ---------------------------------------------------------------------------
  const prismaLike = {
    complaint: {
      create,
      count,
      findMany,
      findUnique,
      update,
      groupBy: complaintGroupBy,
    },
    complaintHistory: { create: historyCreate, findMany: historyFindMany },
    role: { upsert: roleUpsert },
    permission: { upsert: permissionUpsert },
    rolePermission: { upsert: rolePermissionUpsert },
    user: {
      upsert: userUpsert,
      update: userUpdate,
      findUnique: userFindUnique,
      findMany: userFindMany,
      count: userCount,
    },
    userRole: { upsert: userRoleUpsert },
    auditLog: { create: auditLogCreate, findMany: auditLogFindMany },
    complaintCategory: {
      create: categoryCreate,
      findUnique: categoryFindUnique,
      findUniqueOrThrow: categoryFindUniqueOrThrow,
      findMany: categoryFindMany,
      update: categoryUpdate,
    },
    orgUnit: {
      create: orgUnitCreate,
      findUnique: orgUnitFindUnique,
      findUniqueOrThrow: orgUnitFindUniqueOrThrow,
      findMany: orgUnitFindMany,
      update: orgUnitUpdate,
    },
    slaConfig: {
      create: slaConfigCreate,
      findFirst: slaConfigFindFirst,
      findMany: slaConfigFindMany,
      upsert: slaConfigUpsert,
      update: slaConfigUpdate,
      findUniqueOrThrow: slaConfigFindUniqueOrThrow,
    },
    complaintSla: {
      create: complaintSlaCreate,
      findUnique: complaintSlaFindUnique,
      findMany: complaintSlaFindMany,
      update: complaintSlaUpdate,
      updateMany: complaintSlaUpdateMany,
    },
    notificationTemplate: {
      upsert: notificationTemplateUpsert,
      findUnique: notificationTemplateFindUnique,
      findMany: notificationTemplateFindMany,
      count: notificationTemplateCount,
      create: notificationTemplateCreate,
      update: notificationTemplateUpdate,
    },
    notificationDelivery: {
      create: notificationDeliveryCreate,
      findUnique: notificationDeliveryFindUnique,
      update: notificationDeliveryUpdate,
      findMany: notificationDeliveryFindMany,
      count: notificationDeliveryCount,
    },
    caseNote: {
      create: caseNoteCreate,
      findMany: caseNoteFindMany,
    },
    caseTask: {
      create: caseTaskCreate,
      findMany: caseTaskFindMany,
      findFirst: caseTaskFindFirst,
      update: caseTaskUpdate,
    },
    document: {
      create: documentCreate,
      findUnique: documentFindUnique,
      update: documentUpdate,
      delete: documentDelete,
    },
    reportExport: {
      create: reportExportCreate,
      findUnique: reportExportFindUnique,
      update: reportExportUpdate,
    },
    userNotification: {
      create: userNotificationCreate,
      upsert: userNotificationUpsert,
      findMany: userNotificationFindMany,
      count: userNotificationCount,
      findFirst: userNotificationFindFirst,
      update: userNotificationUpdate,
      updateMany: userNotificationUpdateMany,
    },
  };

  const prismaWithTransaction = {
    ...prismaLike,
    $transaction: async <T>(
      callback: (tx: typeof prismaLike) => Promise<T>,
    ): Promise<T> => callback(prismaLike),
  };

  return prismaWithTransaction as unknown as PrismaService;
}
