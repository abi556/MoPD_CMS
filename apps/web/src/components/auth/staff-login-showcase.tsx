"use client";

import Image from "next/image";
import { FileText, LineChart, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function StaffLoginShowcase() {
  const t = useTranslations("auth");

  const highlights = [
    { key: "intake" as const, icon: FileText },
    { key: "workflow" as const, icon: LineChart },
    { key: "audit" as const, icon: ShieldCheck },
  ];

  return (
    <aside className="relative hidden bg-[#f0f2f5] lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col lg:px-8 lg:py-6 lg:pr-10">
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-4xl bg-neutral-950 px-10 py-10 text-white shadow-2xl">
        {/* Diagonal highlight streak */}
        <div className="pointer-events-none absolute -right-24 top-8 h-[110%] w-44 rotate-35 bg-linear-to-b from-white/20 via-white/5 to-transparent" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex shrink-0 justify-center">
            <Image
              src="/mopd_logo.png"
              alt="MoPD"
              width={392}
              height={392}
              className="h-auto w-[16.8rem] object-contain sm:w-[18.2rem]"
              unoptimized
              priority
            />
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              {t("showcaseTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-white/75 sm:text-[0.9375rem]">
              {t("showcaseBody")}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              {t("showcaseFootnote")}
            </p>
          </div>

          <div className="rounded-2xl rounded-tr-[4rem] bg-white/10 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold">{t("showcaseCardTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {t("showcaseCardBody")}
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {highlights.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90"
                >
                  <Icon className="h-3.5 w-3.5 text-primary-fixed" aria-hidden />
                  {t(`showcaseHighlights.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
