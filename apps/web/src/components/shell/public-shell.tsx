"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";

export function PublicShell({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const nav = useTranslations("nav");
  const pub = useTranslations("public");
  const pathname = usePathname();

  const normalizedPath = pathname
    .replace(/^(\/(en|am))(?=\/|$)/, "")
    .replace(/\/+$/, "");
  const isPublicHome = normalizedPath === "" || normalizedPath === "/";
  const isSubmit =
    normalizedPath === "/submit" ||
    normalizedPath.startsWith("/complaints/new");
  const isTrack =
    normalizedPath === "/track" ||
    normalizedPath.startsWith("/complaints/track");

  return (
    <div className="flex min-h-full flex-col font-body text-body antialiased bg-surface text-on-surface">
      {/* Top Navigation Bar */}
      <header className="bg-surface border-b border-border-standard w-full top-0 z-50 sticky">
        <div className="flex justify-between items-center w-full px-gutter max-w-max-width mx-auto h-16">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-3" href="/">
              <Image
                src="/mopd_logo.png"
                alt="MoPD logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-contain"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                {t("appName")}
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                className={`font-body text-body pb-1 transition-colors ${
                  isPublicHome
                    ? "text-primary font-bold border-b-2 border-primary"
                    : "text-text-secondary border-b-2 border-transparent hover:text-primary"
                }`}
                href="/"
              >
                {nav("publicPortal")}
              </Link>
              <Link
                className={`font-body text-body pb-1 transition-colors ${
                  isSubmit
                    ? "text-primary font-bold border-b-2 border-primary"
                    : "text-text-secondary border-b-2 border-transparent hover:text-primary"
                }`}
                href="/complaints/new"
              >
                {nav("submitComplaint")}
              </Link>
              <Link
                className={`font-body text-body pb-1 transition-colors ${
                  isTrack
                    ? "text-primary font-bold border-b-2 border-primary"
                    : "text-text-secondary border-b-2 border-transparent hover:text-primary"
                }`}
                href="/complaints/track"
              >
                {nav("trackStatus")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <div className="h-6 w-px bg-border-standard hidden sm:block"></div>
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex bg-primary text-on-primary px-5 py-2 rounded-lg font-label text-label hover:opacity-90 transition-all active:scale-95 duration-150"
            >
              {nav("login") || "Staff Login"}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      {/* Footer */}
      <footer className="border-t border-border-standard w-full mt-auto bg-inverse-surface text-inverse-on-surface">
        <div className="w-full py-12 px-gutter flex flex-col md:flex-row justify-between items-start md:items-center max-w-max-width mx-auto gap-8">
          <div className="space-y-4">
            <div className="font-label text-label uppercase tracking-widest text-primary font-bold flex items-center gap-2">
              <Image
                src="/mopd_logo.png"
                alt="MoPD logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-contain"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-on-primary">
                {t("appName")}
              </span>
            </div>
            <p className="font-body-sm text-body-sm max-w-xs text-inverse-on-surface/70">
              {pub("footerDescription")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:flex items-center gap-x-12 gap-y-4">
            <Link className="hover:text-primary transition-colors font-body-sm text-body-sm text-inverse-on-surface/70" href="/forbidden">
              {pub("footerPrivacy")}
            </Link>
            <Link className="hover:text-primary transition-colors font-body-sm text-body-sm text-inverse-on-surface/70" href="/forbidden">
              {pub("footerTerms")}
            </Link>
            <Link className="hover:text-primary transition-colors font-body-sm text-body-sm text-inverse-on-surface/70" href="/forbidden">
              {pub("footerContact")}
            </Link>
            <Link className="hover:text-primary transition-colors font-body-sm text-body-sm text-inverse-on-surface/70" href="/forbidden">
              {pub("footerAccessibility")}
            </Link>
          </div>
        </div>
        <div className="max-w-max-width mx-auto px-gutter py-6 border-t border-white/10">
          <p className="font-body-sm text-body-sm text-center text-inverse-on-surface/50">
            {pub("footerCopyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
