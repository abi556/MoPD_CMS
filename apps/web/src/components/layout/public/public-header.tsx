"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PublicNav } from "@/components/layout/public/public-nav";

export function PublicHeader() {
  const nav = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-standard bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-max-width items-center justify-between px-gutter">
        <div className="flex items-center gap-8">
          <Link className="flex cursor-pointer items-center gap-3" href="/">
            <Image
              src="/mopd_logo.png"
              alt="MoPD logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-contain"
            />
            <BrandWordmark
              suffix=" CMS"
              className="text-sm font-semibold tracking-widest text-primary"
            />
          </Link>
          <PublicNav />
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <div className="hidden h-6 w-px bg-border-standard sm:block" aria-hidden />
          <Link
            href="/auth/login"
            className="hidden rounded-lg bg-primary px-5 py-2 font-label text-label text-on-primary transition-all duration-150 hover:opacity-90 active:scale-95 sm:inline-flex"
          >
            {nav("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
