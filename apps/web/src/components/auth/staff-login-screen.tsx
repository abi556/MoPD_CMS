"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { StaffLoginShowcase } from "@/components/auth/staff-login-showcase";

export function StaffLoginScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-stretch bg-[#f5f6f8] font-body text-on-surface antialiased lg:h-screen lg:overflow-hidden">
      <div className="flex w-full min-h-0 flex-col lg:w-1/2 lg:max-w-[50%]">
        <header className="flex shrink-0 items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <Image
              src="/mopd_logo.png"
              alt="MoPD"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-semibold text-on-surface">
              <BrandWordmark suffix=" CMS" />
            </span>
          </Link>
          <LocaleSwitcher />
        </header>

        <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 pb-10 sm:px-10 lg:pb-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      <StaffLoginShowcase />
    </div>
  );
}
