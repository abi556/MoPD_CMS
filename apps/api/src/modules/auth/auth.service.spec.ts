import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const signAsync = jest.fn<Promise<string>, [object, object?]>();
  let service: AuthService;

  beforeEach(() => {
    signAsync.mockReset();
    signAsync.mockResolvedValue('signed-access-token');
    service = new AuthService({ signAsync } as unknown as JwtService);
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
    service.logout(login.user.id, login.refreshToken);

    await expect(service.refresh(login.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects logout when refresh token does not belong to user', async () => {
    const login = await service.login('admin@mopd.local', 'AdminPass123!');

    expect(() =>
      service.logout('user-officer-0001', login.refreshToken),
    ).toThrow(UnauthorizedException);
  });
});
