import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export interface UserListItem {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

export interface UserListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  data: UserListItem[];
  meta: UserListMeta;
}

export interface UserDetailResponse {
  data: UserListItem;
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  email?: string;
  isActive?: boolean;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  roleIds: string[];
}

export interface UpdateUserPayload {
  email?: string;
  roleIds?: string[];
}

export function buildUsersQuery(params: ListUsersParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  if (params.email) search.set("email", params.email);
  if (params.isActive !== undefined) {
    search.set("isActive", params.isActive ? "true" : "false");
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listUsers(
  params: ListUsersParams = {},
): Promise<UserListResponse> {
  return apiGet<UserListResponse>(`/users${buildUsersQuery(params)}`);
}

export async function getUser(id: string): Promise<UserDetailResponse> {
  return apiGet<UserDetailResponse>(`/users/${id}`);
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<UserDetailResponse> {
  return apiPost<UserDetailResponse>("/users", payload, { auth: true });
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserDetailResponse> {
  return apiPatch<UserDetailResponse>(`/users/${id}`, payload);
}

export async function deactivateUser(id: string): Promise<UserDetailResponse> {
  return apiPost<UserDetailResponse>(`/users/${id}/deactivate`, undefined, {
    auth: true,
  });
}
