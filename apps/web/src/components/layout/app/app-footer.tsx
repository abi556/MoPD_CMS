"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AppFooter() {
  const t = useTranslations("staff.shell");

  return (
    <footer className="mt-auto w-full px-gutter py-5 md:py-6">
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-staff-text-muted md:flex-row">
        <p className="text-center md:text-left">
          © 2026 Ministry of Planning and Development
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          aria-label="Footer"
        >
          <Link
            className="transition-colors hover:text-staff-nav-active"
            href="/privacy"
          >
            {t("footerPrivacy")}
          </Link>
          <Link
            className="transition-colors hover:text-staff-nav-active"
            href="/terms"
          >
            {t("footerTerms")}
          </Link>
          <Link
            className="transition-colors hover:text-staff-nav-active"
            href="/contact"
          >
            {t("footerContact")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
