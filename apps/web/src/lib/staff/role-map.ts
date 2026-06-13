import type { RoleListItem } from "@/lib/staff/roles-api";

export function mapRoleNamesToIds(
  names: string[],
  roles: RoleListItem[],
): string[] {
  return names.map((name) => {
    const role = roles.find((r) => r.name === name);
    if (!role) {
      throw new Error(`Unknown role: ${name}`);
    }
    return role.id;
  });
}

export function mapRoleIdsToNames(
  ids: string[],
  roles: RoleListItem[],
): string[] {
  return ids.map((id) => {
    const role = roles.find((r) => r.id === id);
    return role?.name ?? id;
  });
}
