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
  mfaEnabled: boolean;
  isActive: boolean;
}

interface StoredAuditLog {
  id: string;
  eventType: string;
  actorUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  correlationId: string | null;
  metadata: unknown;
  createdAt: Date;
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

export function createPrismaMock(): PrismaService {
  const store = new Map<string, StoredComplaint>();
  const historyStore: StoredComplaintHistory[] = [];
  const roleStore = new Map<string, StoredRole>();
  const permissionStore = new Map<string, StoredPermission>();
  const userStore = new Map<string, StoredUser>();
  const auditLogStore: StoredAuditLog[] = [];
  const userRoleStore = new Set<string>();
  const rolePermissionStore = new Set<string>();
  const slaConfigStore = new Map<string, StoredSlaConfig>();
  const complaintSlaStore = new Map<string, StoredComplaintSla>();
  let sequence = 0;
  let historySequence = 0;
  let auditSequence = 0;
  let slaSeq = 0;

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

  const applyWhere = (
    input: StoredComplaint[],
    where?: {
      status?: StoredComplaint['status'];
      channel?: StoredComplaint['channel'];
      locale?: StoredComplaint['locale'];
      submittedAt?: { gte?: Date; lte?: Date };
    },
  ): StoredComplaint[] => {
    if (!where) {
      return input;
    }
    return input.filter((item) => {
      if (where.status && item.status !== where.status) return false;
      if (where.channel && item.channel !== where.channel) return false;
      if (where.locale && item.locale !== where.locale) return false;
      if (where.submittedAt?.gte && item.submittedAt < where.submittedAt.gte)
        return false;
      if (where.submittedAt?.lte && item.submittedAt > where.submittedAt.lte)
        return false;
      return true;
    });
  };

  const findMany = (args: {
    where?: {
      status?: StoredComplaint['status'];
      channel?: StoredComplaint['channel'];
      locale?: StoredComplaint['locale'];
      submittedAt?: { gte?: Date; lte?: Date };
    };
    skip?: number;
    take?: number;
  }): StoredComplaint[] => {
    const filtered = applyWhere(Array.from(store.values()), args.where);
    const sorted = filtered.sort((a, b) => b.sequenceNo - a.sequenceNo);
    const skip = args.skip ?? 0;
    const take = args.take ?? sorted.length;
    return sorted.slice(skip, skip + take);
  };

  const count = (args: {
    where?: {
      status?: StoredComplaint['status'];
      channel?: StoredComplaint['channel'];
      locale?: StoredComplaint['locale'];
      submittedAt?: { gte?: Date; lte?: Date };
    };
  }): number => applyWhere(Array.from(store.values()), args.where).length;

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

  const historyFindMany = (args: { where: { complaintId: string } }) =>
    historyStore
      .filter((item) => item.complaintId === args.where.complaintId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

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
      Partial<Pick<StoredUser, 'passwordVersion' | 'mfaEnabled'>>;
    const baseCreate: StoredUser = {
      id: create.id,
      email: create.email,
      passwordHash: create.passwordHash,
      isActive: create.isActive,
      passwordVersion: create.passwordVersion ?? 0,
      mfaEnabled: create.mfaEnabled ?? false,
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
    where?: { status?: SlaStatusLiteral };
    include?: { slaConfig?: boolean };
  }): Promise<(StoredComplaintSla & { slaConfig?: StoredSlaConfig })[]> => {
    let all = Array.from(complaintSlaStore.values());
    if (args.where?.status)
      all = all.filter((s) => s.status === args.where!.status);
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
  // Assembled mock
  // ---------------------------------------------------------------------------
  const prismaLike = {
    complaint: { count, findMany, findUnique, update },
    complaintHistory: { findMany: historyFindMany },
    role: { upsert: roleUpsert },
    permission: { upsert: permissionUpsert },
    rolePermission: { upsert: rolePermissionUpsert },
    user: {
      upsert: userUpsert,
      update: userUpdate,
      findUnique: userFindUnique,
    },
    userRole: { upsert: userRoleUpsert },
    auditLog: { create: auditLogCreate },
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
    $transaction: async <T>(
      callback: (tx: {
        complaint: {
          create: typeof create;
          update: typeof update;
          findUnique: typeof findUnique;
        };
        complaintHistory: { create: typeof historyCreate };
      }) => Promise<T>,
    ): Promise<T> =>
      callback({
        complaint: { create, update, findUnique },
        complaintHistory: { create: historyCreate },
      }),
  };

  return prismaLike as unknown as PrismaService;
}
