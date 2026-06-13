import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppAuthGuard } from "@/components/auth/app-auth-guard";
import { StaffOnboardingGuard } from "@/components/auth/staff-onboarding-guard";
import { AppShell } from "@/components/layout/app/app-shell";
import { StaffThemeProvider } from "@/components/staff/theme/staff-theme-provider";
import { parseThemePreference, STAFF_THEME_COOKIE_KEY } from "@/lib/staff/staff-theme";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const initialPreference = parseThemePreference(
    cookieStore.get(STAFF_THEME_COOKIE_KEY)?.value,
  );

  return (
    <StaffThemeProvider initialPreference={initialPreference}>
      <AppAuthGuard>
        <StaffOnboardingGuard>
          <AppShell>{children}</AppShell>
        </StaffOnboardingGuard>
      </AppAuthGuard>
    </StaffThemeProvider>
  );
}
