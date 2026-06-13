/** Mirrors API seed role IDs — used to map user.role names to roleIds for forms. */
export const STAFF_ROLE_CATALOG = [
  { id: "role-super-admin", name: "SuperAdmin" },
  { id: "role-system-admin", name: "SystemAdmin" },
  { id: "role-complaints-admin", name: "ComplaintsAdmin" },
  { id: "role-case-officer", name: "CaseOfficer" },
  { id: "role-reviewer-approver", name: "ReviewerApprover" },
  { id: "role-communications-officer", name: "CommunicationsOfficer" },
  { id: "role-auditor", name: "Auditor" },
  { id: "role-ombudsperson", name: "Ombudsperson" },
  { id: "role-read-only-observer", name: "ReadOnlyObserver" },
] as const;

export type StaffRoleName = (typeof STAFF_ROLE_CATALOG)[number]["name"];

const nameToId = new Map<string, string>(
  STAFF_ROLE_CATALOG.map((r) => [r.name, r.id]),
);
const idToName = new Map<string, string>(
  STAFF_ROLE_CATALOG.map((r) => [r.id, r.name]),
);

export function roleNameToId(name: string): string {
  const id = nameToId.get(name);
  if (!id) {
    throw new Error(`Unknown role name: ${name}`);
  }
  return id;
}

export function roleIdToName(id: string): string {
  const name = idToName.get(id);
  if (!name) {
    return id;
  }
  return name;
}

export function roleNamesToIds(names: string[]): string[] {
  return names.map(roleNameToId);
}
