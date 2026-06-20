"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";
import { formatUnreadBadgeCount } from "@/lib/staff/inbox-notifications";
import { useUnreadNotificationCount } from "./unread-notification-count-context";

export function NotificationBellButton() {
  const t = useTranslations("inbox");
  const { count } = useUnreadNotificationCount();
  const badge = formatUnreadBadgeCount(count);
  const ariaLabel =
    count > 0 ? t("bellLabelWithCount", { count }) : t("bellLabel");

  return (
    <Link
      href={staffRoutes.notifications}
      className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/40 focus-visible:ring-offset-2"
      aria-label={ariaLabel}
    >
      <Bell size={18} aria-hidden />
      {count > 0 ? (
        <span
          className="absolute right-0.5 top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-staff-surface"
          aria-hidden
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
