"use client";

import type { ReactNode } from "react";
import { hasAllPermissions, hasAnyPermission } from "@/lib/permissions";
import { useSession } from "@/components/providers/auth-provider";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  /** When multiple permissions are listed, require all (default) or any. */
  match?: "all" | "any";
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions = [],
  match = "all",
  children,
}: PermissionGateProps) {
  const { user } = useSession();
  const required = permission ? [permission, ...permissions] : permissions;

  const allowed = user
    ? match === "any"
      ? hasAnyPermission(user.permissions, required)
      : hasAllPermissions(user.permissions, required)
    : false;

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
