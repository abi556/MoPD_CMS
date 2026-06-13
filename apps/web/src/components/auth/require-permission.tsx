"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { hasAllPermissions } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface RequirePermissionProps {
  permission?: string;
  permissions?: string[];
  children: ReactNode;
}

export function RequirePermission({
  permission,
  permissions = [],
  children,
}: RequirePermissionProps) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const required = permission ? [permission, ...permissions] : permissions;

  const allowed =
    user && hasAllPermissions(user.permissions, required);

  useEffect(() => {
    if (!isLoading && user && !allowed) {
      router.replace(staffRoutes.forbidden);
    }
  }, [isLoading, user, allowed, router]);

  if (!user) {
    if (isLoading) {
      return (
        <div className="p-8">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="mt-4 h-32 w-full" />
        </div>
      );
    }
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
