import { apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type SlaPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface SlaConfigItem {
  id: string;
  name: string;
  priority: SlaPriority;
  categoryId: string | null;
  targetHours: number;
  warningThresholdPct: number;
  escalationRoleId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSlaPayload {
  name: string;
  priority: SlaPriority;
  categoryId?: string | null;
  targetHours: number;
  warningThresholdPct?: number;
  escalationRoleId?: string | null;
  isActive?: boolean;
}

export interface UpdateSlaPayload {
  name?: string;
  targetHours?: number;
  warningThresholdPct?: number;
  escalationRoleId?: string | null;
  isActive?: boolean;
}

export async function listSlaConfigs(): Promise<SlaConfigItem[]> {
  return apiGet<SlaConfigItem[]>("/admin/sla-configs");
}

export async function createSlaConfig(
  payload: CreateSlaPayload,
): Promise<SlaConfigItem> {
  return apiPost<SlaConfigItem>("/admin/sla-configs", payload);
}

export async function updateSlaConfig(
  id: string,
  payload: UpdateSlaPayload,
): Promise<SlaConfigItem> {
  return apiPatch<SlaConfigItem>(`/admin/sla-configs/${id}`, payload);
}
