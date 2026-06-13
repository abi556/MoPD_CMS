"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { hasAnyAdminPermission } from "@/lib/navigation/build-admin-nav";
import { staffRoutes } from "@/lib/staff/routes";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  const allowed = user ? hasAnyAdminPermission(user) : false;

  useEffect(() => {
    if (!isLoading && user && !allowed) {
      router.replace(staffRoutes.forbidden);
    }
  }, [isLoading, user, allowed, router]);

  if (!user) {
    if (isLoading) {
      return (
        <div className="p-4">
          <LoadingSkeleton className="h-8 w-48" />
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
