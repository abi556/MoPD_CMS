import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export interface RoleListItem {
  id: string;
  name: string;
  permissionCodes: string[];
}

export interface RoleListResponse {
  data: RoleListItem[];
}

export interface RoleDetailResponse {
  data: RoleListItem;
}

export interface PermissionListItem {
  id: string;
  code: string;
  description?: string | null;
}

export interface PermissionListResponse {
  data: PermissionListItem[];
}

export interface CreateRolePayload {
  id: string;
  name: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name?: string;
  permissionIds?: string[];
}

export async function listRoles(): Promise<RoleListItem[]> {
  return apiGet<RoleListItem[]>("/roles");
}

export async function createRole(
  payload: CreateRolePayload,
): Promise<RoleListItem> {
  return apiPost<RoleListItem>("/roles", payload, { auth: true });
}

export async function updateRole(
  id: string,
  payload: UpdateRolePayload,
): Promise<RoleListItem> {
  return apiPatch<RoleListItem>(`/roles/${id}`, payload);
}

export async function deleteRole(id: string): Promise<void> {
  return apiDelete<void>(`/roles/${id}`);
}

export async function listPermissions(): Promise<PermissionListItem[]> {
  return apiGet<PermissionListItem[]>("/permissions");
}
