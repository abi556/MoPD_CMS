import type { PermissionListItem } from "@/lib/staff/roles-api";

export interface PermissionModuleGroup {
  module: string;
  permissions: PermissionListItem[];
}

export function getPermissionModule(code: string): string {
  const colon = code.indexOf(":");
  return colon === -1 ? "other" : code.slice(0, colon);
}

export function groupPermissionsByModule(
  permissions: PermissionListItem[],
): PermissionModuleGroup[] {
  const map = new Map<string, PermissionListItem[]>();
  for (const perm of permissions) {
    const moduleKey = getPermissionModule(perm.code);
    const list = map.get(moduleKey) ?? [];
    list.push(perm);
    map.set(moduleKey, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([moduleKey, perms]) => ({
      module: moduleKey,
      permissions: perms.sort((a, b) => a.code.localeCompare(b.code)),
    }));
}

export function togglePermissionId(
  selected: string[],
  permissionId: string,
  checked: boolean,
): string[] {
  if (checked) {
    return selected.includes(permissionId)
      ? selected
      : [...selected, permissionId];
  }
  return selected.filter((id) => id !== permissionId);
}
