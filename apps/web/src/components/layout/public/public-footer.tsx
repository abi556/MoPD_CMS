"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";

export function PublicFooter() {
  const pub = useTranslations("public");

  const safePub = (key: string, fallback: string) => {
    try {
      return pub(key);
    } catch {
      return fallback;
    }
  };

  const footerLinkClass =
    "font-body-sm text-body-sm text-inverse-on-surface/70 transition-colors hover:text-primary";

  return (
    <footer className="mt-auto w-full border-t border-border-standard bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto flex w-full max-w-max-width flex-col items-start justify-between gap-8 px-gutter py-12 md:flex-row md:items-center">
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
          <p className="max-w-xs font-body-sm text-body-sm text-inverse-on-surface/70">
            {safePub("footerDescription", pub("footerDescription"))}
          </p>
        </div>
        <div className="grid grid-cols-2 items-center gap-x-12 gap-y-4 md:flex">
          <Link className={footerLinkClass} href="/forbidden">
            {safePub("footerPrivacy", "Privacy Policy")}
          </Link>
          <Link className={footerLinkClass} href="/forbidden">
            {safePub("footerTerms", "Terms of Service")}
          </Link>
          <Link className={footerLinkClass} href="/forbidden">
            {safePub("footerContact", "Contact Us")}
          </Link>
          <Link className={footerLinkClass} href="/forbidden">
            {safePub("footerAccessibility", "Accessibility")}
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-max-width border-t border-white/10 px-gutter py-6">
        <p className="text-center font-body-sm text-body-sm text-inverse-on-surface/50">
          {safePub("footerCopyright", pub("footerCopyright"))}
        </p>
      </div>
    </footer>
  );
}
