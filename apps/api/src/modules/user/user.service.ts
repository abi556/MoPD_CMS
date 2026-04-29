import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthUserWithRoles {
  id: string;
  email: string;
  isActive: boolean;
  passwordHash: string;
  userRoles: Array<{ role: { name: string } }>;
}

interface UserDbGateway {
  role: {
    upsert(args: {
      where: { id: string };
      create: { id: string; name: string };
      update: { name: string };
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
            role: true;
          };
        };
      };
    }): Promise<AuthUserWithRoles | null>;
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

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
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
            role: true,
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
            role: true,
          },
        },
      },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  private createPasswordHash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${hashPassword(password, salt)}`;
  }
}
