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
        passwordVersion: number;
        mfaEnabled: boolean;
        isActive: boolean;
        userRoles: Array<{
          role: {
            name: string;
            rolePermissions: Array<{ permission: { code: string } }>;
          };
        }>;
      } | null>,
      [string]
    >()
    .mockResolvedValue({
      id: 'user-admin-0001',
      email: 'admin@mopd.local',
      passwordHash:
        '35e8cf4f97d379ebfbe4e7f4c8b43f3a:242c897f7f29e05eb1271dbbb13b6ed5df1594318717e56b3271fa7e64d563a0d3ff71a8f6072fa63eef611626b1a26e5c979c6f5fb160f96ab2b235b6b0e2da',
      passwordVersion: 0,
      mfaEnabled: false,
      isActive: true,
      userRoles: [
        {
          role: {
            name: 'SuperAdmin',
            rolePermissions: [{ permission: { code: 'admin:ping' } }],
          },
        },
      ],
    });
  const findActiveById = jest
    .fn<
      Promise<{
        id: string;
        email: string;
        passwordHash: string;
        passwordVersion: number;
        mfaEnabled: boolean;
        isActive: boolean;
        userRoles: Array<{
          role: {
            name: string;
            rolePermissions: Array<{ permission: { code: string } }>;
          };
        }>;
      } | null>,
      [string]
    >()
    .mockResolvedValue({
      id: 'user-admin-0001',
      email: 'admin@mopd.local',
      passwordHash:
        '35e8cf4f97d379ebfbe4e7f4c8b43f3a:242c897f7f29e05eb1271dbbb13b6ed5df1594318717e56b3271fa7e64d563a0d3ff71a8f6072fa63eef611626b1a26e5c979c6f5fb160f96ab2b235b6b0e2da',
      passwordVersion: 0,
      mfaEnabled: false,
      isActive: true,
      userRoles: [
        {
          role: {
            name: 'SuperAdmin',
            rolePermissions: [{ permission: { code: 'admin:ping' } }],
          },
        },
      ],
    });
  const updatePasswordHash = jest.fn<Promise<void>, [string, string]>();
  const deferMfaEnrollment = jest.fn<Promise<void>, [string]>();
  const loginAttemptStub = {
    normalizeEmail: (e: string) => e.trim().toLowerCase(),
    ensureEmailNotLockedAsync: jest.fn().mockResolvedValue(undefined),
    recordFailedAttempt: jest.fn().mockResolvedValue(false),
    clearFailures: jest.fn().mockResolvedValue(undefined),
  };
  const mfaStub = {
    isGloballyRequired: jest.fn().mockReturnValue(false),
    isRequiredForRole: jest.fn((roles: string[]) => {
      const elevated = ['SuperAdmin', 'SystemAdmin'];
      if (roles.some((role) => elevated.includes(role))) {
        return { required: true, totpOnly: true };
      }
      return { required: false, totpOnly: false };
    }),
  };
  const queuePasswordResetEmail = jest.fn().mockResolvedValue(undefined);
  let service: AuthService;

  beforeEach(async () => {
    signAsync.mockReset();
    ensureSeedUsers.mockClear();
    findActiveByEmail.mockClear();
    findActiveById.mockClear();
    updatePasswordHash.mockReset();
    deferMfaEnrollment.mockReset();
    loginAttemptStub.ensureEmailNotLockedAsync.mockClear();
    loginAttemptStub.recordFailedAttempt.mockResolvedValue(false);
    loginAttemptStub.clearFailures.mockClear();
    updatePasswordHash.mockResolvedValue(undefined);
    deferMfaEnrollment.mockResolvedValue(undefined);
    signAsync.mockResolvedValue('signed-access-token');

    service = new AuthService(
      { signAsync } as unknown as JwtService,
      {
        ensureSeedUsers,
        findActiveByEmail,
        findActiveById,
        updatePasswordHash,
        deferMfaEnrollment,
      } as unknown as UserService,
      {
        logEvent: jest.fn().mockResolvedValue(undefined),
      } as never,
      loginAttemptStub as never,
      mfaStub as never,
      {
        queuePasswordResetEmail,
      } as never,
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
    expect(result.user.permissions).toEqual(['admin:ping']);
    expect(updatePasswordHash).toHaveBeenCalledWith(
      'user-admin-0001',
      expect.stringMatching(/^\$2[aby]\$\d{2}\$.+/),
    );
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

  it('allows any role to skip MFA enrollment when not enrolled', async () => {
    findActiveById.mockResolvedValue({
      id: 'user-admin-0001',
      email: 'admin@mopd.local',
      passwordHash: 'hash',
      passwordVersion: 0,
      mfaEnabled: false,
      isActive: true,
      userRoles: [
        {
          role: {
            name: 'SuperAdmin',
            rolePermissions: [],
          },
        },
      ],
    });

    const status = await service.describeMfaStatus('user-admin-0001');

    expect(status.canSkipEnroll).toBe(true);
    expect(status.mustEnroll).toBe(false);
    expect(status.totpOnly).toBe(true);

    await service.skipMfaEnrollment('user-admin-0001');
    expect(deferMfaEnrollment).toHaveBeenCalledWith('user-admin-0001');
  });

  it('allows CaseOfficer to skip MFA enrollment', async () => {
    findActiveById.mockResolvedValue({
      id: 'user-officer-0001',
      email: 'officer@mopd.local',
      passwordHash: 'hash',
      passwordVersion: 0,
      mfaEnabled: false,
      isActive: true,
      userRoles: [
        {
          role: {
            name: 'CaseOfficer',
            rolePermissions: [],
          },
        },
      ],
    });

    const status = await service.describeMfaStatus('user-officer-0001');

    expect(status.canSkipEnroll).toBe(true);
    expect(status.totpOnly).toBe(false);
    expect(status.mustEnroll).toBe(false);

    await service.skipMfaEnrollment('user-officer-0001');
    expect(deferMfaEnrollment).toHaveBeenCalledWith('user-officer-0001');
  });
});
