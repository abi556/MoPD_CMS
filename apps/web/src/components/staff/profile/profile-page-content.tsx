"use client";

import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/auth-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { ProfileChangePasswordSection } from "@/components/staff/profile/profile-change-password-section";
import { ProfileSecuritySection } from "@/components/staff/profile/profile-security-section";

export function ProfilePageContent() {
  const t = useTranslations("profile");
  const { user } = useSession();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />

      <section className="rounded-xl border border-staff-border bg-staff-surface p-6">
        <h2 className="font-display text-xl font-semibold text-staff-text">
          {t("accountTitle")}
        </h2>
        <p className="mt-1 text-sm text-staff-text-muted">{t("accountSubtitle")}</p>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-staff-text-muted">
              {t("emailLabel")}
            </dt>
            <dd className="mt-1 text-sm font-medium text-staff-text">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-staff-text-muted">
              {t("rolesLabel")}
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-staff-nav-active-bg/10 px-3 py-1 text-xs font-medium text-staff-nav-active"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-sm text-staff-text-muted">{t("noRoles")}</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <ProfileChangePasswordSection />
      <ProfileSecuritySection />
    </div>
  );
}
