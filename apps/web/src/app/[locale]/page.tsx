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

  const trustCards = [
    {
      key: "secure",
      icon: Shield,
      delay: "100ms",
    },
    {
      key: "tracking",
      icon: Clock,
      delay: "200ms",
    },
    {
      key: "citizenCentered",
      icon: UserCheck,
      delay: "300ms",
    },
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
            {[
              {
                step: "1",
                title: t("steps.submission.title"),
                body: t("steps.submission.body"),
                icon: FileDown,
                color: "bg-primary/10 text-primary",
              },
              {
                step: "2",
                title: t("steps.review.title"),
                body: t("steps.review.body"),
                icon: Eye,
                color: "bg-primary/10 text-primary",
              },
              {
                step: "3",
                title: t("steps.investigation.title"),
                body: t("steps.investigation.body"),
                icon: Search,
                color: "bg-primary/10 text-primary",
              },
              {
                step: "4",
                title: t("steps.resolution.title"),
                body: t("steps.resolution.body"),
                icon: CheckCircle2,
                color: "bg-primary/10 text-primary",
              },
            ].map(({ step, title, body, icon: Icon, color }, index) => (
              <article
                key={step}
                style={{ animationDelay: `${200 + index * 80}ms` }}
                className="group relative rounded-none border border-border-standard bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md animate-fade-in-up fill-mode-both"
              >
                {/* Connecting Arrow for larger screens */}
                {index < 3 && (
                  <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-border-standard md:block transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-none transition-transform duration-300 group-hover:scale-110 ${color}`}>
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
        </div>
      </section>

      {/* Trust & Transparency Section & CTA */}
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
            <div className="absolute inset-0 bg-neutral-950/50 md:bg-neutral-950/40" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-max-width px-gutter py-10 sm:py-12 md:py-10 lg:min-h-[320px] lg:py-12">
            <div className="flex flex-col gap-8 lg:min-h-[280px] lg:justify-between lg:gap-10">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                {trustCards.map(({ key, icon: Icon, delay }) => (
                  <div
                    key={key}
                    className="flex min-w-0 gap-4 border border-white/10 bg-black/25 p-4 backdrop-blur-sm animate-fade-in-up fill-mode-both sm:p-5"
                    style={{ animationDelay: delay }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/20 text-primary-fixed">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-h3 text-base font-semibold text-white sm:text-h3">
                        {t(`trust.${key}.title`)}
                      </h4>
                      <p className="mt-1.5 text-body-sm leading-relaxed text-white/90">
                        {t(`trust.${key}.body`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-none border border-white/10 bg-black/30 p-5 backdrop-blur-sm animate-fade-in-up fill-mode-both [animation-delay:400ms] sm:p-6 md:p-8">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[3rem_3rem] opacity-5" />

                <div className="relative z-10 flex flex-col gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
                      {t("readyTitle")}
                    </h2>
                    <p className="mt-1.5 max-w-xl text-body-sm leading-relaxed text-white/90">
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
        </div>
      </section>
    </PublicShell>
  );
}
