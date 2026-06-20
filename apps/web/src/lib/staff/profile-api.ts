import { apiGet, apiPatch } from "@/lib/api-client";

export type ProfileLocale = "en" | "am";

export interface ProfileUser {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  preferredLocale?: ProfileLocale | null;
}

export interface UpdateOwnProfilePayload {
  email?: string;
  preferredLocale?: ProfileLocale;
}

export async function getCurrentUser(): Promise<ProfileUser> {
  return apiGet<ProfileUser>("/users/me");
}

export async function updateOwnProfile(
  payload: UpdateOwnProfilePayload,
): Promise<ProfileUser> {
  return apiPatch<ProfileUser>("/users/me", payload);
}
