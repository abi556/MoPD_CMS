"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function AuthSessionGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(staffRoutes.auth.login);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSkeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
