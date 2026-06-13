import { apiGet } from "@/lib/api-client";

export interface AdminPingResponse {
  status: string;
}

export async function pingAdmin(): Promise<AdminPingResponse> {
  return apiGet<AdminPingResponse>("/admin/ping");
}
