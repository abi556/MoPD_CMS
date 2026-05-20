import type { JwtUser } from '../interfaces/jwt-user.interface';
import { PERMISSION_ALIASES } from './permission-aliases';

/**
 * Returns true if `granted` includes `required` or any alias pair from PERMISSION_ALIASES.
 */
export function satisfiesPermission(
  granted: readonly string[],
  required: string,
): boolean {
  if (granted.includes(required)) {
    return true;
  }

  for (const [canonical, legacyCodes] of Object.entries(PERMISSION_ALIASES)) {
    if (canonical === required) {
      if (legacyCodes.some((code) => granted.includes(code))) {
        return true;
      }
    }
    if (legacyCodes.includes(required) && granted.includes(canonical)) {
      return true;
    }
  }

  return false;
}

export function hasPermission(
  user: Pick<JwtUser, 'permissions'> | undefined,
  permission: string,
): boolean {
  if (!user?.permissions?.length) {
    return false;
  }
  return satisfiesPermission(user.permissions, permission);
}

export function hasAllPermissions(
  user: Pick<JwtUser, 'permissions'> | undefined,
  required: readonly string[],
): boolean {
  if (!required.length) {
    return true;
  }
  if (!user?.permissions?.length) {
    return false;
  }
  return required.every((permission) =>
    satisfiesPermission(user.permissions, permission),
  );
}

export function hasDirectPermission(
  granted: readonly string[] | undefined,
  code: string,
): boolean {
  return granted?.includes(code) ?? false;
}

/** Broad read across all complaints (not assignee-scoped). Uses direct codes only. */
export function hasComplaintReadAll(
  user: Pick<JwtUser, 'permissions' | 'roles'> | undefined,
): boolean {
  if (!user) {
    return false;
  }
  if (user.roles?.includes('SuperAdmin')) {
    return true;
  }
  return hasDirectPermission(user.permissions, 'complaint:read');
}

/** When true, list/detail/history must filter to assignedToUserId === user.id. */
export function shouldScopeComplaintsToAssignee(
  user: Pick<JwtUser, 'permissions' | 'roles'> | undefined,
): boolean {
  if (!user || hasComplaintReadAll(user)) {
    return false;
  }
  return (
    hasDirectPermission(user.permissions, 'complaint:read:own') ||
    hasDirectPermission(user.permissions, 'complaints:list')
  );
}
