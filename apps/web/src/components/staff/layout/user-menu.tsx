"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { staffRoutes } from "@/lib/staff/routes";
import { useSession } from "@/components/providers/auth-provider";

export function UserAvatarButton() {
  const t = useTranslations("nav-staff");
  const { user } = useSession();
  const initial = user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <Link
      href={staffRoutes.profile}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-staff-nav-active-bg font-label text-sm font-semibold uppercase text-staff-nav-active-text transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active focus-visible:ring-offset-2 focus-visible:ring-offset-staff-surface"
      aria-label={t("profile")}
      title={user?.email ?? t("profile")}
    >
      {initial}
    </Link>
  );
}
