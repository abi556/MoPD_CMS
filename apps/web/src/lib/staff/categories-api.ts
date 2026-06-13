import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { ReferenceDataItem } from "@/lib/staff/reference-data-tree";

export type CategoryItem = ReferenceDataItem;

export interface CreateCategoryPayload {
  code: string;
  nameEn: string;
  nameAm?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
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

export async function listCategories(
  activeOnly?: boolean,
): Promise<CategoryItem[]> {
  return apiGet<CategoryItem[]>(
    `/admin/complaint-categories${buildActiveOnlyQuery(activeOnly)}`,
  );
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<CategoryItem> {
  return apiPost<CategoryItem>("/admin/complaint-categories", payload);
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<CategoryItem> {
  return apiPatch<CategoryItem>(`/admin/complaint-categories/${id}`, payload);
}

export const categoriesApi = {
  list: listCategories,
  create: createCategory,
  update: updateCategory,
};
