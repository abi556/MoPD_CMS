import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createExecutionContext(user?: { roles: string[] }) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  };
}

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = createExecutionContext();

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('allows access when user has one required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['SuperAdmin']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = createExecutionContext({
      roles: ['CaseOfficer', 'SuperAdmin'],
    });

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('throws forbidden when user lacks required roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['SuperAdmin']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = createExecutionContext({ roles: ['CaseOfficer'] });

    expect(() => guard.canActivate(context as never)).toThrow(
      ForbiddenException,
    );
  });
});
