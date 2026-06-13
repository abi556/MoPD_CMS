"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

function ForbiddenContent() {
  const t = useTranslations("staff.forbidden");
  const tNav = useTranslations("nav-staff");
  const { isAuthenticated } = useSession();

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-on-surface">
        {t("title")}
      </h1>
      <p className="mt-4 text-text-secondary">{t("body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isAuthenticated ? (
          <Link href={staffRoutes.home}>
            <Button variant="brand">{tNav("dashboard")}</Button>
          </Link>
        ) : (
          <Link href={staffRoutes.auth.login}>
            <Button variant="brand">{tNav("login")}</Button>
          </Link>
        )}
        <Link href="/">
          <Button variant="secondary">{tNav("home")}</Button>
        </Link>
      </div>
    </div>
  );
}

export function StaffForbiddenScreen() {
  const { isLoading, isAuthenticated } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app-shell">
        <p className="text-text-secondary">…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <AppShell>
        <ForbiddenContent />
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-app-shell">
      <header className="border-b border-border-standard bg-surface px-gutter py-4">
        <span className="font-semibold text-primary">MoPD CMS Staff</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-gutter">
        <ForbiddenContent />
      </main>
    </div>
  );
}
