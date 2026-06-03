"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export function AuthShell({ children }: { children: ReactNode }) {

  return (
    <div className="flex min-h-screen flex-col bg-surface p-margin-mobile font-body text-on-surface antialiased md:p-gutter">
      <header className="mx-auto flex w-full max-w-7xl justify-end py-4">
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="flex w-full max-w-md flex-col gap-8 rounded-lg border border-border-standard bg-surface-container-lowest p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] md:p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex cursor-pointer items-center gap-3">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-on-primary"
                aria-hidden
              >
                Mo
              </span>
            </Link>
            <div>
              <h1 className="font-h1 text-h1 text-primary">
                <BrandWordmark suffix=" CMS" />
              </h1>
              <p className="mt-1 font-body-sm text-body-sm text-text-secondary">
                Staff Console
              </p>
            </div>
          </div>
          {children}
          <footer className="flex flex-col items-center gap-2 border-t border-border-standard pt-4 text-center">
            <span className="font-label text-label text-text-secondary">
              Ministry of Planning and Development
            </span>
            <p className="font-overline text-overline text-text-secondary">
              © 2026 <BrandWordmark className="inline" />. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
