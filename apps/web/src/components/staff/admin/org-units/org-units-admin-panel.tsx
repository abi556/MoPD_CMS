"use client";

import { orgUnitsApi } from "@/lib/staff/org-units-api";
import { ReferenceDataAdminPanel } from "@/components/staff/admin/shared/reference-data-admin-panel";

export function OrgUnitsAdminPanel() {
  return (
    <ReferenceDataAdminPanel
      translationNamespace="admin.orgUnits"
      api={orgUnitsApi}
    />
  );
}
