import type { ReactNode } from "react";
import { AppAuthGuard } from "@/components/auth/app-auth-guard";
import { AppShell } from "@/components/shell/app-shell";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGuard>
      <AppShell>{children}</AppShell>
    </AppAuthGuard>
  );
}
