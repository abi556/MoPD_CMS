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
  const isPublicHome = normalizedPath === "" || normalizedPath === "/";
  const isSubmit = normalizedPath.startsWith("/complaints/new");
  const isTrack = normalizedPath.startsWith("/complaints/track");

  const linkClass = (active: boolean) =>
    `font-body text-body pb-1 transition-colors cursor-pointer ${
      active
        ? "text-primary font-bold border-b-2 border-primary"
        : "text-text-secondary border-b-2 border-transparent hover:text-primary"
    }`;

  return (
    <nav
      className="hidden items-center gap-6 md:flex"
      aria-label={nav("publicPortal")}
    >
      <Link className={linkClass(isPublicHome)} href="/">
        {nav("publicPortal")}
      </Link>
      <Link className={linkClass(isSubmit)} href="/complaints/new">
        {nav("submitComplaint")}
      </Link>
      <Link className={linkClass(isTrack)} href="/complaints/track">
        {nav("trackStatus")}
      </Link>
    </nav>
  );
}
