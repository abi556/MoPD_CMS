import {
  getRolePermissionIds,
  getSeedRoles,
  SEED_PERMISSIONS,
} from './seed-catalog';

describe('seed-catalog', () => {
  it('defines at least nine staff roles', () => {
    expect(getSeedRoles().length).toBeGreaterThanOrEqual(9);
  });

  it('grants workflow:transition to ComplaintsAdmin but not user:manage', () => {
    const permissionIds = getRolePermissionIds('role-complaints-admin');
    const codes = permissionIds.map(
      (id) => SEED_PERMISSIONS.find((permission) => permission.id === id)?.code,
    );
    expect(codes).toContain('workflow:transition');
    expect(codes).not.toContain('user:manage');
  });

  it('grants complaint:read:own to CaseOfficer without complaint:read', () => {
    const permissionIds = getRolePermissionIds('role-case-officer');
    const codes = permissionIds.map(
      (id) => SEED_PERMISSIONS.find((permission) => permission.id === id)?.code,
    );
    expect(codes).toContain('complaint:read:own');
    expect(codes).not.toContain('complaint:read');
  });
});
