/** SRS role names with stable seed IDs (Public User is not a staff role). */
export const ROLE_CATALOG = [
  { id: 'role-super-admin', name: 'SuperAdmin' },
  { id: 'role-system-admin', name: 'SystemAdmin' },
  { id: 'role-complaints-admin', name: 'ComplaintsAdmin' },
  { id: 'role-case-officer', name: 'CaseOfficer' },
  { id: 'role-reviewer-approver', name: 'ReviewerApprover' },
  { id: 'role-communications-officer', name: 'CommunicationsOfficer' },
  { id: 'role-auditor', name: 'Auditor' },
  { id: 'role-ombudsperson', name: 'Ombudsperson' },
  { id: 'role-read-only-observer', name: 'ReadOnlyObserver' },
] as const;

export type RoleCatalogEntry = (typeof ROLE_CATALOG)[number];
export type RoleCatalogName = RoleCatalogEntry['name'];

export function getRoleIdByName(name: RoleCatalogName): string {
  const entry = ROLE_CATALOG.find((role) => role.name === name);
  if (!entry) {
    throw new Error(`Unknown role name: ${name}`);
  }
  return entry.id;
}
