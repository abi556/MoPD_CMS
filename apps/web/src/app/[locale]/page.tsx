import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import {
  FileDown,
  Eye,
  Search,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  UserCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";

/** Bump ?v= when replacing public/complaint-processing-isometric-illustration.png */
const HERO_ILLUSTRATION_SRC =
  "/complaint-processing-isometric-illustration.png?v=2";

async function hasRefreshCookie(): Promise<boolean> {
  const name = process.env.AUTH_REFRESH_COOKIE_NAME ?? "refresh_token";
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(name)?.value);
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await hasRefreshCookie()) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("public");

  const processSteps = [
    {
      step: "1",
      title: t("steps.submission.title"),
      body: t("steps.submission.body"),
      icon: FileDown,
    },
    {
      step: "2",
      title: t("steps.review.title"),
      body: t("steps.review.body"),
      icon: Eye,
    },
    {
      step: "3",
      title: t("steps.investigation.title"),
      body: t("steps.investigation.body"),
      icon: Search,
    },
    {
      step: "4",
      title: t("steps.resolution.title"),
      body: t("steps.resolution.body"),
      icon: CheckCircle2,
    },
  ] as const;

  const trustPillars = [
    { key: "secure", icon: Shield },
    { key: "tracking", icon: Clock },
    { key: "citizenCentered", icon: UserCheck },
  ] as const;

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="relative overflow-x-clip bg-brand-wash pb-16 pt-12 sm:pb-20 sm:pt-16 md:pb-32 md:pt-24">
        {/* Subtle background grid pattern for premium tech-gov feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[4rem_4rem] [mask-image:radial-gradient  (ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 md:right-[41.666667%]" />

        <div className="relative mx-auto grid w-full max-w-max-width items-center gap-8 px-gutter md:grid-cols-12 md:gap-6 lg:gap-8">
          <div className="space-y-6 md:col-span-7 animate-fade-in-up">
            <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight text-on-background sm:text-4xl md:text-6xl md:leading-[1.15]">
              {t.rich("heroHeading", {
                highlight: (chunks) => (
                  <span className="text-primary font-bold">{chunks}</span>
                ),
              })}
            </h1>
            <p className="max-w-2xl text-body text-text-secondary leading-relaxed">
              {t("heroBody")} {t("heroBodyExtended")}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href="/complaints/new" className="w-full sm:w-auto">
                <Button type="button" size="lg" fullWidth className="sm:w-auto">
                  {t("ctaSubmit")}
                </Button>
              </Link>
              <Link href="/complaints/track" className="w-full sm:w-auto">
                <Button variant="secondary" type="button" size="lg" fullWidth className="sm:w-auto">
                  {t("ctaTrack")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero illustration — transparent PNG on brand-wash; unoptimized to preserve alpha */}
          <div className="relative hidden min-h-0 md:col-span-5 md:flex md:items-center md:justify-end md:overflow-visible animate-scale-in [animation-delay:100ms] fill-mode-both">
            <Image
              src={HERO_ILLUSTRATION_SRC}
              alt={t("heroIllustrationAlt")}
              width={960}
              height={960}
              sizes="(max-width: 768px) 100vw, 55vw"
              unoptimized
              className="pointer-events-none h-auto w-[min(150%,42rem)] max-w-none select-none object-contain object-right md:translate-x-[6%] lg:translate-x-[10%]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Process Section - Crisp, Sharp, and Staggered Animations */}
      <section className="border-y border-border-standard/50 bg-surface-container-lowest py-16 md:py-24">
        <div className="mx-auto w-full max-w-max-width px-gutter">
          <div className="mx-auto mb-10 max-w-2xl text-center animate-fade-in-up fill-mode-both [animation-delay:150ms] md:mb-16">
            <h2 className="font-h1 text-h1 text-on-background tracking-tight">
              {t("processTitle")}
            </h2>
            <p className="mt-3 text-body text-text-secondary leading-relaxed">
              {t("processSubtitle")}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            {processSteps.map(({ step, title, body, icon: Icon }, index) => (
              <article
                key={step}
                style={{ animationDelay: `${200 + index * 80}ms` }}
                className="group relative rounded-none border border-border-standard bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md animate-fade-in-up fill-mode-both"
              >
                {index < processSteps.length - 1 ? (
                  <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-border-standard md:block transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-none bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-4xl font-bold text-border-standard/60 select-none">
                    0{step}
                  </span>
                </div>

                <h3 className="mt-6 font-h3 text-h3 text-on-surface font-semibold group-hover:text-primary transition-colors duration-200">
                  {title}
                </h3>
                <p className="mt-2.5 text-body-sm text-text-secondary leading-relaxed">
                  {body}
                </p>
              </article>
            ))}
          </div>

          <div
            className="mt-14 border-t border-border-standard/60 pt-10 md:mt-16 md:pt-12 animate-fade-in-up fill-mode-both [animation-delay:520ms]"
            aria-labelledby="trust-section-title"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-overline text-overline uppercase tracking-widest text-primary">
                {t("trustSectionEyebrow")}
              </p>
              <h3
                id="trust-section-title"
                className="mt-2 font-h2 text-h2 text-on-background tracking-tight"
              >
                {t("trustSectionTitle")}
              </h3>
            </div>

            <ul className="mt-8 grid gap-6 md:mt-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border-standard/80">
              {trustPillars.map(({ key, icon: Icon }, index) => (
                <li
                  key={key}
                  style={{ animationDelay: `${560 + index * 80}ms` }}
                  className="animate-fade-in-up fill-mode-both md:px-8 lg:px-10"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h4 className="font-h3 text-base font-semibold text-on-surface sm:text-h3">
                        {t(`trust.${key}.title`)}
                      </h4>
                      <p className="mt-1.5 text-body-sm leading-relaxed text-text-secondary">
                        {t(`trust.${key}.body`)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Landmarks CTA */}
      <section className="relative overflow-hidden bg-neutral-950" aria-label={t("landmarksAlt")}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/aa_landmarks.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              aria-hidden
            />
            <div className="absolute inset-0 bg-neutral-950/25 md:bg-neutral-950/15" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-max-width items-center px-gutter py-12 sm:py-16 md:py-20 lg:min-h-[280px]">
            <div className="relative w-full overflow-hidden rounded-none border border-white/20 bg-white/5 p-5 shadow-lg shadow-black/10 backdrop-blur-md animate-fade-in-up fill-mode-both sm:p-6 md:p-8">
              <div className="relative z-10 flex flex-col gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl md:text-3xl">
                    {t("readyTitle")}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-body-sm leading-relaxed text-white/95 drop-shadow-sm">
                    {t("readyBody")}
                  </p>
                </div>
                <Link href="/complaints/new" className="w-full shrink-0 md:w-auto">
                  <Button type="button" size="lg" fullWidth className="md:w-auto">
                    {t("startSubmission")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
