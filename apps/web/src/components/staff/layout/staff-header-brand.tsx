"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { useSidebar } from "@/components/staff/layout/sidebar-context";
import { staffRoutes } from "@/lib/staff/routes";

/** Logo in header when the sidebar is collapsed (desktop only). */
export function StaffHeaderBrandMark() {
  const { isCollapsed } = useSidebar();

  if (!isCollapsed) {
    return null;
  }

  return (
    <Link
      href={staffRoutes.home}
      aria-label="MoPD CMS Staff Console"
      className="hidden shrink-0 cursor-pointer items-center gap-2 md:flex"
    >
      <Image
        src="/mopd_logo.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        unoptimized
        priority
        aria-hidden
      />
      <span className="hidden text-sm font-semibold text-staff-text xl:inline">
        <BrandWordmark suffix=" CMS" />
      </span>
    </Link>
  );
}
