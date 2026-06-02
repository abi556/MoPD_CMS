"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function AppAuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useSession();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router, locale]);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="mt-4 h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
