import {
  hasAllPermissions,
  hasComplaintReadAll,
  hasPermission,
  shouldScopeComplaintsToAssignee,
  satisfiesPermission,
} from './permission-check';

describe('satisfiesPermission', () => {
  it('matches exact permission codes', () => {
    expect(satisfiesPermission(['complaints:list'], 'complaints:list')).toBe(
      true,
    );
  });

  it('allows SDS complaint:read when user has legacy complaints:list', () => {
    expect(satisfiesPermission(['complaints:list'], 'complaint:read')).toBe(
      true,
    );
  });

  it('allows legacy complaints:list when user has SDS complaint:read', () => {
    expect(satisfiesPermission(['complaint:read'], 'complaints:list')).toBe(
      true,
    );
  });

  it('returns false for unknown codes', () => {
    expect(satisfiesPermission(['admin:ping'], 'complaint:approve')).toBe(
      false,
    );
  });
});

describe('hasPermission', () => {
  it('returns false for empty user permissions', () => {
    expect(hasPermission({ permissions: [] }, 'complaint:read')).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('requires every listed permission via aliases', () => {
    expect(
      hasAllPermissions(
        { permissions: ['complaints:assign', 'complaints:transition'] },
        ['workflow:transition', 'complaints:assign'],
      ),
    ).toBe(true);
  });
});

describe('hasComplaintReadAll', () => {
  it('treats SuperAdmin as read-all', () => {
    expect(
      hasComplaintReadAll({ roles: ['SuperAdmin'], permissions: [] }),
    ).toBe(true);
  });

  it('treats direct complaint:read as read-all', () => {
    expect(
      hasComplaintReadAll({
        roles: ['ComplaintsAdmin'],
        permissions: ['complaint:read'],
      }),
    ).toBe(true);
  });

  it('does not treat legacy list alone as read-all', () => {
    expect(
      hasComplaintReadAll({
        roles: ['CaseOfficer'],
        permissions: ['complaint:read:own', 'complaints:list'],
      }),
    ).toBe(false);
  });
});

describe('shouldScopeComplaintsToAssignee', () => {
  it('scopes case officer with legacy list permissions', () => {
    expect(
      shouldScopeComplaintsToAssignee({
        roles: ['CaseOfficer'],
        permissions: ['complaint:read:own', 'complaints:list'],
      }),
    ).toBe(true);
  });

  it('does not scope complaints admin with complaint:read', () => {
    expect(
      shouldScopeComplaintsToAssignee({
        roles: ['ComplaintsAdmin'],
        permissions: ['complaint:read'],
      }),
    ).toBe(false);
  });
});
