"use client";

import { categoriesApi } from "@/lib/staff/categories-api";
import { ReferenceDataAdminPanel } from "@/components/staff/admin/shared/reference-data-admin-panel";

export function CategoriesAdminPanel() {
  return (
    <ReferenceDataAdminPanel
      translationNamespace="admin.categories"
      api={categoriesApi}
    />
  );
}
