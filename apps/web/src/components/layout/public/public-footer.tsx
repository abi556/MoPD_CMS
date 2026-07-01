"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";

export function PublicFooter() {
  const pub = useTranslations("public");
  const nav = useTranslations("nav-public");

  const footerLinkClass =
    "block font-body-sm text-body-sm text-inverse-on-surface/70 transition-colors hover:text-primary";

  return (
    <footer className="mt-auto w-full border-t border-border-standard bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto flex w-full max-w-max-width flex-col gap-10 px-gutter py-12 md:flex-row md:items-start md:justify-between">
        <div className="shrink-0 space-y-4">
          <Link href="/" className="flex items-center gap-2 font-label text-label font-bold tracking-widest text-primary cursor-pointer">
            <Image
              src="/mopd_logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-contain"
              aria-hidden
            />
            <BrandWordmark
              suffix=" CMS"
              className="text-sm font-semibold tracking-widest text-on-primary"
            />
          </Link>
          <p className="font-body-sm text-body-sm leading-snug text-inverse-on-surface/70">
            <span className="block md:whitespace-nowrap">
              {pub("footerDescriptionLine1")}
            </span>
            <span className="block md:whitespace-nowrap">
              {pub("footerDescriptionLine2")}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-row items-start justify-between gap-6 sm:gap-8 md:ml-10 md:w-auto md:min-w-88 md:max-w-2xl md:flex-1 md:justify-between lg:ml-16 lg:gap-12 xl:ml-20 xl:gap-16">
          <nav aria-label={pub("footerLegalLinks")} className="flex flex-col gap-3">
            <Link className={footerLinkClass} href="/privacy">
              {pub("footerPrivacy")}
            </Link>
            <Link className={footerLinkClass} href="/terms">
              {pub("footerTerms")}
            </Link>
            <Link className={footerLinkClass} href="/cookies">
              {pub("footerCookies")}
            </Link>
            <Link className={footerLinkClass} href="/accessibility">
              {pub("footerAccessibility")}
            </Link>
          </nav>

          <nav aria-label={pub("footerHelpLinks")} className="flex flex-col gap-3">
            <Link className={footerLinkClass} href="/faq">
              {pub("footerFaq")}
            </Link>
            <Link className={footerLinkClass} href="/contact">
              {pub("footerContact")}
            </Link>
            <a
              className={footerLinkClass}
              href="https://www.mopd.gov.et"
              target="_blank"
              rel="noopener noreferrer"
            >
              mopd.gov.et
            </a>
          </nav>

          <nav aria-label={pub("footerPortalLinks")} className="flex flex-col gap-3">
            <Link className={footerLinkClass} href="/">
              {nav("home")}
            </Link>
            <Link className={footerLinkClass} href="/complaints/new">
              {nav("submitComplaint")}
            </Link>
            <Link className={footerLinkClass} href="/complaints/track">
              {nav("trackStatus")}
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-max-width border-t border-white/10 px-gutter py-6">
        <p className="text-center font-body-sm text-body-sm text-inverse-on-surface/50">
          {pub("footerCopyright")}
        </p>
      </div>
    </footer>
  );
}
