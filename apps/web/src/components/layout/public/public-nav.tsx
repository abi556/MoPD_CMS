"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

function normalizePath(pathname: string): string {
  return pathname.replace(/^(\/(en|am))(?=\/|$)/, "").replace(/\/+$/, "");
}

export function PublicNav() {
  const nav = useTranslations("nav");
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);
  const isSubmit = normalizedPath.startsWith("/complaints/new");
  const isTrack = normalizedPath.startsWith("/complaints/track");

  const linkClass = (active: boolean) =>
    `font-body text-body py-1.5 transition-colors cursor-pointer border-y-2 border-t-transparent ${
      active
        ? "text-primary font-bold border-b-primary"
        : "text-text-secondary font-medium border-b-transparent hover:text-primary hover:border-b-primary/30"
    }`;

  return (
    <nav
      className="hidden items-center gap-6 md:flex"
      aria-label={nav("submitComplaint")}
    >
      <Link className={linkClass(isSubmit)} href="/complaints/new">
        {nav("submitComplaint")}
      </Link>
      <Link className={linkClass(isTrack)} href="/complaints/track">
        {nav("trackStatus")}
      </Link>
    </nav>
  );
}
