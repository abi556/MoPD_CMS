import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const signAsync = jest.fn<Promise<string>, [object, object?]>();
  const ensureSeedUsers = jest.fn<Promise<void>, []>().mockResolvedValue();
  const findActiveByEmail = jest
    .fn<
      Promise<{
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        userRoles: Array<{ role: { name: string } }>;
      } | null>,
      [string]
    >()
    .mockResolvedValue({
      id: 'user-admin-0001',
      email: 'admin@mopd.local',
      passwordHash:
        '35e8cf4f97d379ebfbe4e7f4c8b43f3a:242c897f7f29e05eb1271dbbb13b6ed5df1594318717e56b3271fa7e64d563a0d3ff71a8f6072fa63eef611626b1a26e5c979c6f5fb160f96ab2b235b6b0e2da',
      isActive: true,
      userRoles: [{ role: { name: 'SuperAdmin' } }],
    });
  const findActiveById = jest
    .fn<
      Promise<{
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        userRoles: Array<{ role: { name: string } }>;
      } | null>,
      [string]
    >()
    .mockResolvedValue({
      id: 'user-admin-0001',
      email: 'admin@mopd.local',
      passwordHash:
        '35e8cf4f97d379ebfbe4e7f4c8b43f3a:242c897f7f29e05eb1271dbbb13b6ed5df1594318717e56b3271fa7e64d563a0d3ff71a8f6072fa63eef611626b1a26e5c979c6f5fb160f96ab2b235b6b0e2da',
      isActive: true,
      userRoles: [{ role: { name: 'SuperAdmin' } }],
    });
  let service: AuthService;

  beforeEach(async () => {
    signAsync.mockReset();
    ensureSeedUsers.mockClear();
    findActiveByEmail.mockClear();
    findActiveById.mockClear();
    signAsync.mockResolvedValue('signed-access-token');

    service = new AuthService(
      { signAsync } as unknown as JwtService,
      {
        ensureSeedUsers,
        findActiveByEmail,
        findActiveById,
      } as unknown as UserService,
    );
    await service.onModuleInit();
  });

  it('logs in with valid credentials and issues token pair', async () => {
    const result = await service.login('admin@mopd.local', 'AdminPass123!');

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken.length).toBeGreaterThanOrEqual(16);
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    expect(result.user.email).toBe('admin@mopd.local');
    expect(result.user.roles).toEqual(['SuperAdmin']);
  });

  it('rejects login with invalid credentials', async () => {
    findActiveByEmail.mockResolvedValueOnce(null);
    await expect(
      service.login('admin@mopd.local', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rotates refresh token and invalidates previous token', async () => {
    const login = await service.login('admin@mopd.local', 'AdminPass123!');
    const refreshed = await service.refresh(login.refreshToken);

    expect(refreshed.accessToken).toBe('signed-access-token');
    expect(refreshed.refreshToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).not.toBe(login.refreshToken);

    await expect(service.refresh(login.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('invalidates refresh token on logout', async () => {
    const login = await service.login('admin@mopd.local', 'AdminPass123!');
    await service.logout(login.user.id, login.refreshToken);

    await expect(service.refresh(login.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects logout when refresh token does not belong to user', async () => {
    const login = await service.login('admin@mopd.local', 'AdminPass123!');

    await expect(
      service.logout('user-officer-0001', login.refreshToken),
    ).rejects.toThrow(UnauthorizedException);
  });
});
