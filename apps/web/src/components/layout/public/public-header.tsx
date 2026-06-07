"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PublicNav } from "@/components/layout/public/public-nav";

export function PublicHeader() {
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
        </div>
      </div>
    </header>
  );
}
