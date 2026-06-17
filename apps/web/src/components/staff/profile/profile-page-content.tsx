"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/auth-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { ProfileChangePasswordSection } from "@/components/staff/profile/profile-change-password-section";
import { ProfileSecuritySection } from "@/components/staff/profile/profile-security-section";
import { StaffSurfaceCard } from "@/components/staff/ui/staff-surface-card";
import { StaffTabs } from "@/components/staff/ui/staff-tabs";

type ProfileTab = "account" | "password" | "security";

function tabFromHash(hash: string): ProfileTab {
  if (hash === "#security" || hash === "#password") {
    return hash.replace("#", "") as ProfileTab;
  }
  return "account";
}

export function ProfilePageContent() {
  const t = useTranslations("profile");
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");

  useEffect(() => {
    const syncFromHash = () => {
      setActiveTab(tabFromHash(window.location.hash));
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const handleTabChange = (id: string) => {
    const next = id as ProfileTab;
    setActiveTab(next);
    const hash = next === "account" ? "" : `#${next}`;
    window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />

      <StaffTabs
        ariaLabel={t("tabsLabel")}
        activeId={activeTab}
        onChange={handleTabChange}
        tabs={[
          { id: "account", label: t("tabAccount") },
          { id: "password", label: t("tabPassword") },
          { id: "security", label: t("tabSecurity") },
        ]}
      />

      {activeTab === "account" ? (
        <StaffSurfaceCard title={t("accountTitle")} subtitle={t("accountSubtitle")}>
          <dl className="grid gap-5 sm:grid-cols-2">
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
        </StaffSurfaceCard>
      ) : null}

      {activeTab === "password" ? <ProfileChangePasswordSection /> : null}
      {activeTab === "security" ? <ProfileSecuritySection /> : null}
    </div>
  );
}
