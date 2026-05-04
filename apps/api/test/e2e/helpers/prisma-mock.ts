import { PrismaService } from '../../../src/prisma/prisma.service';
import type { ComplaintStatusLiteral } from './types';

interface StoredComplaint {
  id: string;
  sequenceNo: number;
  referenceNo: string;
  status: ComplaintStatusLiteral;
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

export function createPrismaMock(): PrismaService {
  const store = new Map<string, StoredComplaint>();
  const historyStore: StoredComplaintHistory[] = [];
  const roleStore = new Map<string, StoredRole>();
  const permissionStore = new Map<string, StoredPermission>();
  const userStore = new Map<string, StoredUser>();
  const auditLogStore: StoredAuditLog[] = [];
  const userRoleStore = new Set<string>();
  const rolePermissionStore = new Set<string>();
  let sequence = 0;
  let historySequence = 0;
  let auditSequence = 0;

  const create = (args: {
    data: Omit<
      StoredComplaint,
      | 'id'
      | 'sequenceNo'
      | 'submittedAt'
      | 'assignedToUserId'
      | 'assignedByUserId'
      | 'assignedAt'
      | 'assignmentReason'
      | 'lastTransitionByUserId'
      | 'lastTransitionAt'
      | 'lastTransitionReason'
    > & {
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
      if (where.status && item.status !== where.status) {
        return false;
      }
      if (where.channel && item.channel !== where.channel) {
        return false;
      }
      if (where.locale && item.locale !== where.locale) {
        return false;
      }
      if (where.submittedAt?.gte && item.submittedAt < where.submittedAt.gte) {
        return false;
      }
      if (where.submittedAt?.lte && item.submittedAt > where.submittedAt.lte) {
        return false;
      }
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
      ? {
          ...existing,
          ...(args.update as Partial<StoredUser>),
        }
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
    if (!existing) {
      throw new Error('record not found');
    }
    let passwordVersion = existing.passwordVersion ?? 0;
    const incr = args.data.passwordVersion?.increment;
    if (incr !== undefined) {
      passwordVersion += incr;
    }
    const { passwordVersion: _ignore, ...rest } = args.data;
    void _ignore;
    const next: StoredUser = {
      ...existing,
      ...rest,
      passwordVersion:
        incr !== undefined ? passwordVersion : existing.passwordVersion ?? 0,
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
    if (!user) {
      return Promise.resolve(null);
    }

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

  const prismaLike = {
    complaint: {
      count,
      findMany,
      findUnique,
      update,
    },
    complaintHistory: {
      findMany: historyFindMany,
    },
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
