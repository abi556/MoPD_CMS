import type { ReactNode } from "react";
import { AppAuthGuard } from "@/components/auth/app-auth-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGuard>
      <AppShell>{children}</AppShell>
    </AppAuthGuard>
  );
}
