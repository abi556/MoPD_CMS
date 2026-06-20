"use client";

import type { ReactNode } from "react";
import { AppFooter } from "@/components/layout/app/app-footer";
import { AppHeader } from "@/components/layout/app/app-header";
import { AppSidebar } from "@/components/layout/app/app-sidebar";
import { StaffBreadcrumbs } from "@/components/staff/layout/staff-breadcrumbs";
import { MobileBottomNav } from "@/components/staff/layout/mobile-bottom-nav";
import { UnreadNotificationCountProvider } from "@/components/staff/notifications/unread-notification-count-context";
import { OfflineBanner } from "@/components/staff/layout/offline-banner";
import { SidebarProvider, useSidebar } from "@/components/staff/layout/sidebar-context";
import { StaffKeyboardShortcutsProvider } from "@/components/staff/help/staff-keyboard-shortcuts-provider";
import { useStaffThemeOptional } from "@/components/staff/theme/staff-theme-provider";

function AppShellFrame({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { resolvedTheme } = useStaffThemeOptional();

  return (
    <div
      className="staff-shell flex min-h-screen bg-staff-shell font-body text-staff-text antialiased"
      data-theme={resolvedTheme}
      data-sidebar-collapsed={isCollapsed ? "true" : "false"}
      suppressHydrationWarning
    >
      <AppSidebar />
      <div
        className={`relative flex min-h-screen w-full flex-1 flex-col transition-[margin,width] duration-300 ease-out md:w-[calc(100%-var(--staff-sidebar-offset))] ${
          isCollapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar-wide"
        }`}
        style={
          {
            "--staff-sidebar-offset": isCollapsed ? "72px" : "256px",
          } as React.CSSProperties
        }
      >
        <AppHeader />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-max-width flex-1 p-margin-mobile pb-20 md:p-gutter md:pb-gutter">
          <StaffBreadcrumbs />
          {children}
        </main>
        <AppFooter />
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <UnreadNotificationCountProvider>
        <StaffKeyboardShortcutsProvider>
          <AppShellFrame>{children}</AppShellFrame>
        </StaffKeyboardShortcutsProvider>
      </UnreadNotificationCountProvider>
    </SidebarProvider>
  );
}
