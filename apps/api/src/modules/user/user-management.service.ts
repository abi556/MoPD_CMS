import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

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
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(params: {
    page: number;
    pageSize: number;
    email?: string;
    isActive?: boolean;
  }): Promise<{
    data: Array<{
      id: string;
      email: string;
      roles: string[];
      isActive: boolean;
    }>;
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const where = {
      email: params.email
        ? {
            contains: params.email,
            mode: 'insensitive' as const,
          }
        : undefined,
      isActive: params.isActive,
    };
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: params.pageSize,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data: rows.map((user) => ({
        id: user.id,
        email: user.email,
        roles: user.userRoles.map((userRole) => userRole.role.name),
        isActive: user.isActive,
      })),
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / params.pageSize),
      },
    };
  }

  async getUserById(id: string): Promise<{
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((userRole) => userRole.role.name),
      isActive: user.isActive,
    };
  }

  async createUser(input: {
    email: string;
    password: string;
    roleIds: string[];
  }): Promise<{
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: input.roleIds } },
    });
    if (roles.length !== input.roleIds.length) {
      throw new NotFoundException('One or more roles were not found');
    }

    const created = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: input.email,
        passwordHash: bcrypt.hashSync(input.password, getBcryptCostFactor()),
        mustChangePassword: true,
        mustEnrollMfa: true,
        isActive: true,
      },
    });

    await this.prisma.userRole.createMany({
      data: input.roleIds.map((roleId) => ({
        userId: created.id,
        roleId,
      })),
      skipDuplicates: true,
    });

    return this.getUserById(created.id);
  }

  async updateUser(
    id: string,
    input: { email?: string; roleIds?: string[] },
  ): Promise<{
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (input.email && input.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (emailTaken && emailTaken.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          email: input.email ?? existing.email,
        },
      });

      if (input.roleIds) {
        const roles = await tx.role.findMany({
          where: { id: { in: input.roleIds } },
        });
        if (roles.length !== input.roleIds.length) {
          throw new NotFoundException('One or more roles were not found');
        }

        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: input.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
    });

    return this.getUserById(id);
  }

  async deactivateUser(id: string): Promise<{
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  }> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return this.getUserById(id);
  }

  async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  }> {
    return this.getUserById(userId);
  }

  async updateCurrentUser(
    userId: string,
    email: string,
  ): Promise<{
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  }> {
    return this.updateUser(userId, { email });
  }

  async listRoles(): Promise<
    Array<{ id: string; name: string; permissionCodes: string[] }>
  > {
    const rows = await this.prisma.role.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return rows.map((role) => ({
      id: role.id,
      name: role.name,
      permissionCodes: role.rolePermissions.map(
        (rolePermission) => rolePermission.permission.code,
      ),
    }));
  }

  async createRole(input: {
    id: string;
    name: string;
    permissionIds: string[];
  }): Promise<{ id: string; name: string; permissionCodes: string[] }> {
    const existing = await this.prisma.role.findUnique({
      where: { id: input.id },
    });
    if (existing) {
      throw new ConflictException('Role already exists');
    }
    await this.prisma.role.create({
      data: {
        id: input.id,
        name: input.name,
      },
    });
    await this.replaceRolePermissions(input.id, input.permissionIds);
    const roles = await this.listRoles();
    const role = roles.find((item) => item.id === input.id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async updateRole(
    id: string,
    input: { name?: string; permissionIds?: string[] },
  ): Promise<{ id: string; name: string; permissionCodes: string[] }> {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }
    await this.prisma.role.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
      },
    });
    if (input.permissionIds) {
      await this.replaceRolePermissions(id, input.permissionIds);
    }
    const roles = await this.listRoles();
    const role = roles.find((item) => item.id === id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async deleteRole(id: string): Promise<void> {
    const inUse = await this.prisma.userRole.count({ where: { roleId: id } });
    if (inUse > 0) {
      throw new ConflictException(
        'Role is assigned to users and cannot be deleted',
      );
    }
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }
    await this.prisma.role.delete({ where: { id } });
  }

  async listPermissions(): Promise<
    Array<{ id: string; code: string; description: string | null }>
  > {
    return this.prisma.permission.findMany({
      orderBy: [{ code: 'asc' }],
      select: {
        id: true,
        code: true,
        description: true,
      },
    });
  }

  private async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions were not found');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    });
  }
}
