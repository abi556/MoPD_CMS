import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
    userRole: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: UserManagementService;

  beforeEach(() => {
    Object.values(prisma).forEach((group) => {
      if (typeof group === 'object' && group !== null) {
        Object.values(group).forEach((fn) => {
          if (typeof fn === 'function' && 'mockReset' in fn) {
            fn.mockReset();
          }
        });
      }
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback(prisma),
    );
    service = new UserManagementService(prisma as never);
  });

  it('lists users with pagination metadata', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@mopd.local',
        isActive: true,
        userRoles: [{ role: { name: 'CaseOfficer' } }],
      },
    ]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.listUsers({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('creates user with valid roles', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.role.findMany.mockResolvedValue([{ id: 'role-case-officer' }]);
    prisma.user.create.mockResolvedValue({
      id: 'user-new',
      email: 'new@mopd.local',
      isActive: true,
    });
    prisma.userRole.createMany.mockResolvedValue({ count: 1 });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-new',
      email: 'new@mopd.local',
      isActive: true,
      userRoles: [{ role: { name: 'CaseOfficer' } }],
    });

    const result = await service.createUser({
      email: 'new@mopd.local',
      password: 'StrongPass123!',
      roleIds: ['role-case-officer'],
    });

    expect(result.id).toBe('user-new');
    expect(result.roles).toContain('CaseOfficer');
  });

  it('rejects duplicate user emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'exists' });
    await expect(
      service.createUser({
        email: 'exists@mopd.local',
        password: 'StrongPass123!',
        roleIds: ['role-case-officer'],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('blocks deleting assigned role', async () => {
    prisma.userRole.count.mockResolvedValue(1);
    await expect(service.deleteRole('role-case-officer')).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws not found for missing role on delete', async () => {
    prisma.userRole.count.mockResolvedValue(0);
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(service.deleteRole('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
