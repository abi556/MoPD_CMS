"use client";

import type { ReactNode } from "react";
import { hasAllPermissions } from "@/lib/permissions";
import { useSession } from "@/components/providers/auth-provider";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions = [],
  children,
}: PermissionGateProps) {
  const { user } = useSession();
  const required = permission ? [permission, ...permissions] : permissions;

  if (!user || !hasAllPermissions(user.permissions, required)) {
    return null;
  }

  return <>{children}</>;
}
