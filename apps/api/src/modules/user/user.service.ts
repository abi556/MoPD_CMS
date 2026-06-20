import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import {
  getRolePermissionIds,
  getSeedRoles,
  SEED_PERMISSIONS,
} from '../auth/rbac/seed-catalog';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthUserWithRoles {
  id: string;
  email: string;
  isActive: boolean;
  passwordHash: string;
  passwordVersion: number;
  mustChangePassword: boolean;
  mustEnrollMfa: boolean;
  mfaEnabled: boolean;
  mfaMethod: string | null;
  totpSecret: string | null;
  totpVerifiedAt: Date | null;
  preferredLocale?: 'en' | 'am' | null;
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
        mustChangePassword?: boolean;
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
        mustChangePassword?: boolean;
        mfaEnabled?: boolean;
        mfaMethod?: string | null;
        totpSecret?: string | null;
        totpVerifiedAt?: Date | null;
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

function getOptionalSeedEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
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

    const seedRoles = getSeedRoles();
    for (const role of seedRoles) {
      await this.db.role.upsert({
        where: { id: role.id },
        create: role,
        update: { name: role.name },
      });
    }

    for (const permission of SEED_PERMISSIONS) {
      await this.db.permission.upsert({
        where: { id: permission.id },
        create: permission,
        update: {
          code: permission.code,
          description: permission.description,
        },
      });
    }

    for (const role of seedRoles) {
      const permissionIds = getRolePermissionIds(role.id);
      for (const permissionId of permissionIds) {
        await this.db.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          create: {
            roleId: role.id,
            permissionId,
          },
          update: {},
        });
      }
    }

    const superAdminRoleId =
      process.env.AUTH_SEED_SUPER_ADMIN_ROLE_ID ?? 'role-super-admin';
    const caseOfficerRoleId =
      process.env.AUTH_SEED_CASE_OFFICER_ROLE_ID ?? 'role-case-officer';

    const seedUsers = [
      {
        id: getRequiredEnv('AUTH_SEED_SUPER_ADMIN_ID'),
        email: getRequiredEnv('AUTH_SEED_SUPER_ADMIN_EMAIL'),
        password: getRequiredEnv('AUTH_SEED_SUPER_ADMIN_PASSWORD'),
        roleIds: [superAdminRoleId],
      },
      {
        id: getRequiredEnv('AUTH_SEED_CASE_OFFICER_ID'),
        email: getRequiredEnv('AUTH_SEED_CASE_OFFICER_EMAIL'),
        password: getRequiredEnv('AUTH_SEED_CASE_OFFICER_PASSWORD'),
        roleIds: [caseOfficerRoleId],
      },
      {
        id: getOptionalSeedEnv(
          'AUTH_SEED_CASE_OFFICER_2_ID',
          'user-officer-0002',
        ),
        email: getOptionalSeedEnv(
          'AUTH_SEED_CASE_OFFICER_2_EMAIL',
          'officer2@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_CASE_OFFICER_2_PASSWORD',
          'Officer2Pass123!',
        ),
        roleIds: [caseOfficerRoleId],
      },
      {
        id: getOptionalSeedEnv(
          'AUTH_SEED_SYSTEM_ADMIN_ID',
          'user-system-admin-0001',
        ),
        email: getOptionalSeedEnv(
          'AUTH_SEED_SYSTEM_ADMIN_EMAIL',
          'system-admin@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_SYSTEM_ADMIN_PASSWORD',
          'SystemAdminPass123!',
        ),
        roleIds: ['role-system-admin'],
      },
      {
        id: getOptionalSeedEnv(
          'AUTH_SEED_COMPLAINTS_ADMIN_ID',
          'user-complaints-admin-0001',
        ),
        email: getOptionalSeedEnv(
          'AUTH_SEED_COMPLAINTS_ADMIN_EMAIL',
          'complaints-admin@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_COMPLAINTS_ADMIN_PASSWORD',
          'ComplaintsAdminPass123!',
        ),
        roleIds: ['role-complaints-admin'],
      },
      {
        id: getOptionalSeedEnv('AUTH_SEED_REVIEWER_ID', 'user-reviewer-0001'),
        email: getOptionalSeedEnv(
          'AUTH_SEED_REVIEWER_EMAIL',
          'reviewer@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_REVIEWER_PASSWORD',
          'ReviewerPass123!',
        ),
        roleIds: ['role-reviewer-approver'],
      },
      {
        id: getOptionalSeedEnv(
          'AUTH_SEED_COMMUNICATIONS_ID',
          'user-communications-0001',
        ),
        email: getOptionalSeedEnv(
          'AUTH_SEED_COMMUNICATIONS_EMAIL',
          'communications@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_COMMUNICATIONS_PASSWORD',
          'CommunicationsPass123!',
        ),
        roleIds: ['role-communications-officer'],
      },
      {
        id: getOptionalSeedEnv('AUTH_SEED_AUDITOR_ID', 'user-auditor-0001'),
        email: getOptionalSeedEnv(
          'AUTH_SEED_AUDITOR_EMAIL',
          'auditor@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_AUDITOR_PASSWORD',
          'AuditorPass123!',
        ),
        roleIds: ['role-auditor'],
      },
      {
        id: getOptionalSeedEnv(
          'AUTH_SEED_OMBUDSPERSON_ID',
          'user-ombudsperson-0001',
        ),
        email: getOptionalSeedEnv(
          'AUTH_SEED_OMBUDSPERSON_EMAIL',
          'ombudsperson@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_OMBUDSPERSON_PASSWORD',
          'OmbudspersonPass123!',
        ),
        roleIds: ['role-ombudsperson'],
      },
      {
        id: getOptionalSeedEnv('AUTH_SEED_OBSERVER_ID', 'user-observer-0001'),
        email: getOptionalSeedEnv(
          'AUTH_SEED_OBSERVER_EMAIL',
          'observer@mopd.local',
        ),
        password: getOptionalSeedEnv(
          'AUTH_SEED_OBSERVER_PASSWORD',
          'ObserverPass123!',
        ),
        roleIds: ['role-read-only-observer'],
      },
    ];

    for (const seedUser of seedUsers) {
      await this.db.user.upsert({
        where: { id: seedUser.id },
        create: {
          id: seedUser.id,
          email: seedUser.email,
          passwordHash: this.createPasswordHash(seedUser.password),
          mustChangePassword: true,
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

  async changePasswordWithVersionBump(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    const mustEnrollMfa =
      user.mustEnrollMfa || (user.mustChangePassword && !user.mfaEnabled);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordVersion: { increment: 1 },
        mustChangePassword: false,
        mustEnrollMfa,
      },
    });
  }

  async deferMfaEnrollment(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mustEnrollMfa: false },
    });
  }

  async setMfaEnrollment(
    userId: string,
    data: {
      mfaEnabled: boolean;
      mfaMethod: string | null;
      totpSecret: string | null;
      totpVerifiedAt: Date | null;
    },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(data.mfaEnabled ? { mustEnrollMfa: false } : {}),
      },
    });
  }

  async clearMfaEnrollment(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaMethod: null,
        totpSecret: null,
        totpVerifiedAt: null,
      },
    });
  }

  private createPasswordHash(password: string): string {
    return bcrypt.hashSync(password, getBcryptCostFactor());
  }
}
