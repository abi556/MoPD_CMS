"use client";

import type { ReactNode } from "react";
import { AppFooter } from "@/components/layout/app/app-footer";
import { AppHeader } from "@/components/layout/app/app-header";
import { AppSidebar } from "@/components/layout/app/app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-app-shell font-body text-on-surface antialiased">
      <AppSidebar />
      <div className="relative flex min-h-screen w-full flex-1 flex-col md:ml-sidebar-wide md:w-[calc(100%-256px)]">
        <AppHeader />
        <main className="mx-auto w-full max-w-max-width flex-1 p-margin-mobile md:p-gutter">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
