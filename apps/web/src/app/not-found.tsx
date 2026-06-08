import Link from "next/link";
import { BrokenLinkArt } from "@/components/public/error-illustrations";

/**
 * Root-level 404 for completely unmatched URLs. This renders outside the
 * `[locale]` segment (and therefore outside the next-intl provider), so it uses
 * plain links and bilingual copy rather than the translation hooks.
 */
export default function RootNotFound() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center overflow-hidden bg-brand-wash">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-25 mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,#000_70%,transparent_100%)]" />

      <div className="relative mx-auto grid w-full max-w-(--spacing-max-width) items-center gap-10 px-gutter py-16 md:grid-cols-2 md:gap-12 md:py-24">
        <div className="order-2 space-y-5 text-center md:order-1 md:text-left">
          <span className="font-display text-5xl font-bold tracking-tight text-primary/30 md:text-6xl">
            404
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-brand-deep sm:text-4xl md:text-5xl md:leading-[1.1]">
            This page took a wrong turn
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-text-secondary md:mx-0">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved. Let&rsquo;s get you back on track.
          </p>
          <p lang="am" className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary/80 md:mx-0">
            የሚፈልጉት ገጽ የለም ወይም ተዛውሯል። ወደ ትክክለኛው መንገድ እንመልስዎ።
          </p>
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-center md:justify-start">
            <Link
              href="/en"
              className="inline-flex min-h-11 items-center justify-center rounded-none bg-primary px-8 py-3.5 text-base font-semibold text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Back to home
            </Link>
            <Link
              href="/en/complaints/track"
              className="inline-flex min-h-11 items-center justify-center rounded-none border border-border-standard bg-surface-container-lowest px-8 py-3.5 text-base font-semibold text-on-surface shadow-sm transition-all duration-200 hover:bg-surface-container-low active:scale-[0.98]"
            >
              Track a complaint
            </Link>
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <div className="w-full max-w-sm md:max-w-md">
            <BrokenLinkArt className="h-auto w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
