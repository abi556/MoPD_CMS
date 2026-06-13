"use client";

import type { ReactNode } from "react";
import { AppFooter } from "@/components/layout/app/app-footer";
import { AppHeader } from "@/components/layout/app/app-header";
import { AppSidebar } from "@/components/layout/app/app-sidebar";
import { StaffBreadcrumbs } from "@/components/staff/layout/staff-breadcrumbs";
import { MobileBottomNav } from "@/components/staff/layout/mobile-bottom-nav";
import { SidebarProvider } from "@/components/staff/layout/sidebar-context";
import { useStaffThemeOptional } from "@/components/staff/theme/staff-theme-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useStaffThemeOptional();

  return (
    <SidebarProvider>
      <div
        className="staff-shell flex min-h-screen bg-staff-shell font-body text-staff-text antialiased"
        data-theme={resolvedTheme}
        suppressHydrationWarning
      >
        <AppSidebar />
        <div className="relative flex min-h-screen w-full flex-1 flex-col md:ml-sidebar-wide md:w-[calc(100%-256px)]">
          <AppHeader />
          <main className="mx-auto w-full max-w-max-width flex-1 p-margin-mobile pb-20 md:p-gutter md:pb-gutter">
            <StaffBreadcrumbs />
            {children}
          </main>
          <AppFooter />
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
