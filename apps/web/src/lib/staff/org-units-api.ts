import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { ReferenceDataItem } from "@/lib/staff/reference-data-tree";

export type OrgUnitItem = ReferenceDataItem;

export interface CreateOrgUnitPayload {
  code: string;
  nameEn: string;
  nameAm?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateOrgUnitPayload {
  code?: string;
  nameEn?: string;
  nameAm?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function buildActiveOnlyQuery(activeOnly?: boolean): string {
  if (activeOnly === undefined) return "";
  return `?activeOnly=${activeOnly ? "true" : "false"}`;
}

export async function listOrgUnits(
  activeOnly?: boolean,
): Promise<OrgUnitItem[]> {
  return apiGet<OrgUnitItem[]>(
    `/admin/org-units${buildActiveOnlyQuery(activeOnly)}`,
  );
}

export async function createOrgUnit(
  payload: CreateOrgUnitPayload,
): Promise<OrgUnitItem> {
  return apiPost<OrgUnitItem>("/admin/org-units", payload);
}

export async function updateOrgUnit(
  id: string,
  payload: UpdateOrgUnitPayload,
): Promise<OrgUnitItem> {
  return apiPatch<OrgUnitItem>(`/admin/org-units/${id}`, payload);
}

export const orgUnitsApi = {
  list: listOrgUnits,
  create: createOrgUnit,
  update: updateOrgUnit,
};
