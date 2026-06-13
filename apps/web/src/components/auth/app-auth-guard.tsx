"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { staffRoutes } from "@/lib/staff/routes";
import { StaffAuthLoadingShell } from "@/components/staff/layout/staff-auth-loading-shell";

export function AppAuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useSession();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(staffRoutes.auth.login);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  if (!user) {
    if (isLoading) {
      return <StaffAuthLoadingShell />;
    }
    return null;
  }

  return <>{children}</>;
}
