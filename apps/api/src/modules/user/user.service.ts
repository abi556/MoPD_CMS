import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthUserWithRoles {
  id: string;
  email: string;
  isActive: boolean;
  passwordHash: string;
  passwordVersion: number;
  mfaEnabled: boolean;
  userRoles: Array<{
    role: {
      name: string;
      rolePermissions: Array<{ permission: { code: string } }>;
    };
  }>;
}

interface UserDbGateway {
  role: {
    upsert(args: {
      where: { id: string };
      create: { id: string; name: string };
      update: { name: string };
    }): Promise<unknown>;
  };
  permission: {
    upsert(args: {
      where: { id: string };
      create: { id: string; code: string; description?: string };
      update: { code: string; description?: string };
    }): Promise<unknown>;
  };
  rolePermission: {
    upsert(args: {
      where: {
        roleId_permissionId: {
          roleId: string;
          permissionId: string;
        };
      };
      create: {
        roleId: string;
        permissionId: string;
      };
      update: Record<string, never>;
    }): Promise<unknown>;
  };
  user: {
    upsert(args: {
      where: { id: string };
      create: {
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
      };
      update: {
        email: string;
        passwordHash: string;
        isActive: boolean;
      };
    }): Promise<unknown>;
    findUnique(args: {
      where: { id?: string; email?: string };
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true;
                  };
                };
              };
            };
          };
        };
      };
    }): Promise<AuthUserWithRoles | null>;
    update(args: {
      where: { id: string };
      data: {
        passwordHash?: string;
        passwordVersion?: { increment: number };
        mfaEnabled?: boolean;
      };
    }): Promise<unknown>;
  };
  userRole: {
    upsert(args: {
      where: {
        userId_roleId: {
          userId: string;
          roleId: string;
        };
      };
      create: {
        userId: string;
        roleId: string;
      };
      update: Record<string, never>;
    }): Promise<unknown>;
  };
}

function isTruthy(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured when auth seeding is enabled`);
  }
  return value;
}

function getBcryptCostFactor(): number {
  const raw = process.env.AUTH_BCRYPT_COST;
  if (!raw) {
    return 12;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 10 || parsed > 15) {
    return 12;
  }
  return parsed;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): UserDbGateway {
    return this.prisma as unknown as UserDbGateway;
  }

  async ensureSeedUsers(): Promise<void> {
    if (!isTruthy(process.env.AUTH_SEED_ENABLED)) {
      return;
    }

    const seedRoles = [
      {
        id: process.env.AUTH_SEED_SUPER_ADMIN_ROLE_ID ?? 'role-super-admin',
        name: 'SuperAdmin',
      },
      {
        id: process.env.AUTH_SEED_CASE_OFFICER_ROLE_ID ?? 'role-case-officer',
        name: 'CaseOfficer',
      },
    ];
    for (const role of seedRoles) {
      await this.db.role.upsert({
        where: { id: role.id },
        create: role,
        update: { name: role.name },
      });
    }

    const seedPermissions = [
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
        description:
          'Manage system configuration (SLA, categories, org units).',
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
    ];
    for (const permission of seedPermissions) {
      await this.db.permission.upsert({
        where: { id: permission.id },
        create: permission,
        update: {
          code: permission.code,
          description: permission.description,
        },
      });
    }

    const rolePermissionMap: Record<string, string[]> = {
      'role-super-admin': seedPermissions.map((permission) => permission.id),
      'role-case-officer': [
        'perm-complaints-list',
        'perm-complaints-detail',
        'perm-complaints-history',
        'perm-complaints-assign',
        'perm-complaints-transition',
        'perm-complaint-escalate',
        'perm-case-read',
        'perm-case-write',
        'perm-document-upload',
        'perm-document-read',
        'perm-document-delete',
      ],
    };
    for (const [roleId, permissionIds] of Object.entries(rolePermissionMap)) {
      for (const permissionId of permissionIds) {
        await this.db.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId,
            },
          },
          create: {
            roleId,
            permissionId,
          },
          update: {},
        });
      }
    }

    const seedUsers = [
      {
        id: getRequiredEnv('AUTH_SEED_SUPER_ADMIN_ID'),
        email: getRequiredEnv('AUTH_SEED_SUPER_ADMIN_EMAIL'),
        password: getRequiredEnv('AUTH_SEED_SUPER_ADMIN_PASSWORD'),
        roleIds: [seedRoles[0].id],
      },
      {
        id: getRequiredEnv('AUTH_SEED_CASE_OFFICER_ID'),
        email: getRequiredEnv('AUTH_SEED_CASE_OFFICER_EMAIL'),
        password: getRequiredEnv('AUTH_SEED_CASE_OFFICER_PASSWORD'),
        roleIds: [seedRoles[1].id],
      },
    ];

    for (const seedUser of seedUsers) {
      await this.db.user.upsert({
        where: { id: seedUser.id },
        create: {
          id: seedUser.id,
          email: seedUser.email,
          passwordHash: this.createPasswordHash(seedUser.password),
          isActive: true,
        },
        update: {
          email: seedUser.email,
          passwordHash: this.createPasswordHash(seedUser.password),
          isActive: true,
        },
      });

      for (const roleId of seedUser.roleIds) {
        await this.db.userRole.upsert({
          where: {
            userId_roleId: {
              userId: seedUser.id,
              roleId,
            },
          },
          create: {
            userId: seedUser.id,
            roleId,
          },
          update: {},
        });
      }
    }
  }

  async findActiveByEmail(email: string): Promise<AuthUserWithRoles | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  async findActiveById(id: string): Promise<AuthUserWithRoles | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /** Used after forgot-password flow: bumps passwordVersion to invalidate old refresh tokens. */
  async resetPasswordWithVersionBump(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordVersion: { increment: 1 },
      },
    });
  }

  private createPasswordHash(password: string): string {
    return bcrypt.hashSync(password, getBcryptCostFactor());
  }
}
