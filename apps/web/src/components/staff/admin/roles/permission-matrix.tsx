"use client";

import { useTranslations } from "next-intl";
import type { PermissionListItem } from "@/lib/staff/roles-api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  groupPermissionsByModule,
  togglePermissionId,
} from "@/components/staff/admin/roles/permission-matrix.utils";

interface PermissionMatrixProps {
  permissions: PermissionListItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({
  permissions,
  selectedIds,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const t = useTranslations("admin.roles");
  const groups = groupPermissionsByModule(permissions);

  return (
    <div className="flex max-h-80 flex-col gap-4 overflow-y-auto pr-1">
      <p className="text-sm font-medium text-on-surface">{t("matrixTitle")}</p>
      {groups.map((group) => (
        <fieldset key={group.module} className="flex flex-col gap-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {group.module}
          </legend>
          {group.permissions.map((perm) => (
            <Checkbox
              key={perm.id}
              name={`perm-${perm.id}`}
              label={
                <span>
                  <span className="font-medium">{perm.code}</span>
                  {perm.description ? (
                    <span className="ml-2 text-text-secondary">
                      — {perm.description}
                    </span>
                  ) : null}
                </span>
              }
              checked={selectedIds.includes(perm.id)}
              disabled={disabled}
              onChange={(e) =>
                onChange(
                  togglePermissionId(selectedIds, perm.id, e.target.checked),
                )
              }
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

export function permissionCodesToIds(
  codes: string[],
  permissions: PermissionListItem[],
): string[] {
  return codes.map((code) => {
    const perm = permissions.find((p) => p.code === code);
    if (!perm) {
      throw new Error(`Unknown permission: ${code}`);
    }
    return perm.id;
  });
}
