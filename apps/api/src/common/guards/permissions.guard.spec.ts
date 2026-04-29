import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

function createExecutionContext(user?: {
  roles: string[];
  permissions?: string[];
}) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  };
}

describe('PermissionsGuard', () => {
  it('allows access when no permissions are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = createExecutionContext();

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('allows access when user has all required permissions', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['complaints:assign', 'complaints:transition']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = createExecutionContext({
      roles: ['CaseOfficer'],
      permissions: ['complaints:assign', 'complaints:transition'],
    });

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('throws forbidden when user lacks one required permission', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['complaints:assign', 'complaints:transition']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = createExecutionContext({
      roles: ['CaseOfficer'],
      permissions: ['complaints:assign'],
    });

    expect(() => guard.canActivate(context as never)).toThrow(
      ForbiddenException,
    );
  });
});
