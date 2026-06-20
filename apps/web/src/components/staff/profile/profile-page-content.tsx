"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";
import { DashboardPageHeader } from "@/components/staff/dashboard/dashboard-page-header";
import { ProfileAccountSection } from "@/components/staff/profile/profile-account-section";
import { ProfileChangePasswordSection } from "@/components/staff/profile/profile-change-password-section";
import { ProfilePreferencesSection } from "@/components/staff/profile/profile-preferences-section";
import { ProfileSecuritySection } from "@/components/staff/profile/profile-security-section";
import { StaffTabs } from "@/components/staff/ui/staff-tabs";

export type ProfileSection = "account" | "password" | "security" | "preferences";

const TAB_ROUTES: Record<ProfileSection, string> = {
  account: staffRoutes.profile,
  password: staffRoutes.profilePassword,
  security: staffRoutes.profileMfa,
  preferences: staffRoutes.profilePreferences,
};

interface ProfilePageContentProps {
  section?: ProfileSection;
}

export function ProfilePageContent({ section = "account" }: ProfilePageContentProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const { user } = useSession();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#password") {
      router.replace(TAB_ROUTES.password);
    } else if (hash === "#security") {
      router.replace(TAB_ROUTES.security);
    }
  }, [router]);

  const handleTabChange = (id: string) => {
    const next = id as ProfileSection;
    router.push(TAB_ROUTES[next]);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} subtitle={t("subtitle")} />

      <StaffTabs
        ariaLabel={t("tabsLabel")}
        activeId={section}
        onChange={handleTabChange}
        tabs={[
          { id: "account", label: t("tabAccount") },
          { id: "password", label: t("tabPassword") },
          { id: "security", label: t("tabSecurity") },
          { id: "preferences", label: t("tabPreferences") },
        ]}
      />

      {section === "account" ? <ProfileAccountSection /> : null}
      {section === "password" ? <ProfileChangePasswordSection /> : null}
      {section === "security" ? <ProfileSecuritySection /> : null}
      {section === "preferences" ? <ProfilePreferencesSection /> : null}
    </div>
  );
}
