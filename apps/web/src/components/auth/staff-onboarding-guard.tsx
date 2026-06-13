"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { staffRoutes } from "@/lib/staff/routes";
import { StaffAuthLoadingShell } from "@/components/staff/layout/staff-auth-loading-shell";

/** Blocks dashboard until mandatory password change. */
export function StaffOnboardingGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }
    if (user.mustChangePassword) {
      router.replace(staffRoutes.auth.changePassword);
    }
  }, [isLoading, user, router]);

  if (!user) {
    return isLoading ? <StaffAuthLoadingShell /> : null;
  }

  if (user.mustChangePassword) {
    return null;
  }

  return <>{children}</>;
}
