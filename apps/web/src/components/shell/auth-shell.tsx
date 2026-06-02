"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";

export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("common");

  return (
    <div className="bg-surface min-h-screen flex flex-col p-margin-mobile md:p-gutter font-body text-on-surface antialiased">
      <header className="flex justify-end w-full max-w-7xl mx-auto py-4">
        <LocaleSwitcher />
      </header>
      <main className="flex-1 flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-lg border border-border-standard shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-8 md:p-[32px] flex flex-col gap-8">
          <div className="text-center flex flex-col items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-on-primary"
                aria-hidden="true"
              >
                Mo
              </span>
            </Link>
            <div>
              <h1 className="font-h1 text-h1 text-primary">{t("appName")}</h1>
              <p className="font-body-sm text-body-sm text-text-secondary mt-1">Staff Console</p>
            </div>
          </div>
          {children}
          <div className="pt-4 border-t border-border-standard text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="font-label text-label">Ministry of Planning and Development</span>
            </div>
            <p className="font-overline text-overline text-text-secondary uppercase">© 2026 MoPD. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
