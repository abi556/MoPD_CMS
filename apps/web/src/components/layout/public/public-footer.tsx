"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";

export function PublicFooter() {
  const pub = useTranslations("public");
  const nav = useTranslations("nav");

  const footerLinkClass =
    "block font-body-sm text-body-sm text-inverse-on-surface/70 transition-colors hover:text-primary";

  return (
    <footer className="mt-auto w-full border-t border-border-standard bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto w-full max-w-max-width space-y-10 px-gutter py-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-label text-label font-bold tracking-widest text-primary">
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
          </div>
          <p className="max-w-md font-body-sm text-body-sm text-inverse-on-surface/70">
            {pub("footerDescription")}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 sm:gap-10 md:gap-16">
          <nav aria-label={pub("footerLegalLinks")} className="flex flex-col gap-3">
            <Link className={footerLinkClass} href="/privacy">
              {pub("footerPrivacy")}
            </Link>
            <Link className={footerLinkClass} href="/terms">
              {pub("footerTerms")}
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
