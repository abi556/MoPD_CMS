"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PublicMobileNav } from "@/components/layout/public/public-mobile-nav";
import { PublicNav } from "@/components/layout/public/public-nav";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-standard bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-max-width items-center justify-between gap-3 px-gutter sm:h-16">
        <div className="flex min-w-0 items-center gap-6 md:gap-8">
          <Link className="flex min-w-0 cursor-pointer items-center gap-2.5 sm:gap-3" href="/">
            <Image
              src="/mopd_logo.png"
              alt="MoPD logo"
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 rounded-md object-contain sm:h-10 sm:w-10"
            />
            <BrandWordmark
              suffix=" CMS"
              className="truncate text-xs font-semibold tracking-widest text-primary sm:text-sm"
            />
          </Link>
          <PublicNav />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <PublicMobileNav />
        </div>
      </div>
    </header>
  );
}
