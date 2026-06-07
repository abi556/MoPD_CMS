import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import {
  CircleCheck,
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

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-wash pb-24 pt-16 md:pb-32 md:pt-24">
        {/* Subtle background grid pattern for premium tech-gov feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />

        <div className="relative mx-auto grid w-full max-w-max-width items-center gap-12 px-gutter md:grid-cols-12">
          <div className="space-y-6 md:col-span-7 animate-fade-in-up">
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-on-background md:text-6xl md:leading-[1.15]">
              {t.rich("heroHeading", {
                highlight: (chunks) => (
                  <span className="text-primary font-bold">{chunks}</span>
                ),
              })}
            </h1>
            <p className="max-w-2xl text-body text-text-secondary leading-relaxed">
              {t("heroBody")} {t("heroBodyExtended")}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/complaints/new">
                <Button type="button" className="rounded-none px-8 py-3.5 text-base shadow-sm transition-all duration-200 hover:bg-primary/95 hover:shadow-md active:scale-[0.98]">
                  {t("ctaSubmit")}
                </Button>
              </Link>
              <Link href="/complaints/track">
                <Button variant="secondary" type="button" className="rounded-none px-8 py-3.5 text-base shadow-sm transition-all duration-200 hover:bg-surface-container-low hover:shadow-md active:scale-[0.98]">
                  {t("ctaTrack")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual Block - Sharp, Professional, and Interactive */}
          <div className="relative hidden md:col-span-5 md:block animate-scale-in [animation-delay:100ms] fill-mode-both">
            <div className="relative aspect-square rounded-none border border-border-standard bg-surface-container-lowest p-8 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-surface/20 to-transparent opacity-50" />
              
              <Image
                src="/mopd_logo.png"
                alt="MoPD portal visual"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain object-[center_38%] p-12 pb-24 opacity-95 transition-transform duration-500 hover:scale-[1.02]"
                priority
              />
              
              {/* Floating Status Card */}
              <div className="absolute left-8 right-8 bottom-6 rounded-none border border-border-standard bg-surface-container-lowest/95 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-none bg-success/10 text-success">
                      <CircleCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-placeholder">
                        {t("complaintIdLabel")}
                      </p>
                      <p className="font-mono text-sm font-bold text-on-surface">
                        #MP-2026-0882
                      </p>
                    </div>
                  </div>
                  <span className="rounded-none bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    Resolved
                  </span>
                </div>
                <div className="mt-3 h-1 w-full bg-surface-container-high">
                  <div className="h-1 w-full bg-success transition-all duration-1000" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Crisp, Sharp, and Staggered Animations */}
      <section className="bg-surface-container-lowest py-24 border-y border-border-standard/50">
        <div className="mx-auto w-full max-w-max-width px-gutter">
          <div className="mx-auto mb-16 max-w-2xl text-center animate-fade-in-up [animation-delay:150ms] fill-mode-both">
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

      {/* Trust & Transparency Section & CTA overlayed on bottom */}
      <section className="relative overflow-hidden">
        {/* Background Image with elegant dark overlay */}
        <div className="relative w-full aspect-1080/281">
          <Image
            src="/aa_landmarks.png"
            alt="Addis Ababa Landmarks"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          {/* Dark, modern transparent overlay - lighter for better visibility */}
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[0.5px]" />
          
          <div className="absolute inset-0 flex flex-col justify-between py-8">
            <div className="mx-auto w-full max-w-max-width px-gutter">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex gap-4 p-5 border border-white/5 bg-black/15 backdrop-blur-[1px] animate-fade-in-up [animation-delay:100ms] fill-mode-both">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/20 text-primary-fixed">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-h3 text-h3 text-white font-semibold">Secure &amp; Private</h4>
                    <p className="mt-1.5 text-body-sm text-white/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      Your data is protected under the Ethiopian Personal Data Protection Proclamation No. 1321/2024.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 border border-white/5 bg-black/15 backdrop-blur-[1px] animate-fade-in-up [animation-delay:200ms] fill-mode-both">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/20 text-primary-fixed">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-h3 text-h3 text-white font-semibold">Real-time Tracking</h4>
                    <p className="mt-1.5 text-body-sm text-white/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      Track your complaint status at any time with your unique, secure reference number.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 border border-white/5 bg-black/15 backdrop-blur-[1px] animate-fade-in-up [animation-delay:300ms] fill-mode-both">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/20 text-primary-fixed">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-h3 text-h3 text-white font-semibold">Citizen-Centered</h4>
                    <p className="mt-1.5 text-body-sm text-white/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      Designed to ensure transparency, fairness, and accountability in administrative processes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section - Overlayed directly on the bottom part of the landmarks image */}
            <div className="mx-auto w-full max-w-max-width px-gutter">
              <div className="relative overflow-hidden rounded-none border border-white/5 bg-black/25 p-6 md:p-8 animate-fade-in-up [animation-delay:400ms] fill-mode-both backdrop-blur-[1px]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-5" />
                
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl text-white font-semibold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {t("readyTitle")}
                    </h2>
                    <p className="mt-1.5 max-w-xl text-body-sm text-white/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {t("readyBody")}
                    </p>
                  </div>
                  <Link href="/complaints/new">
                    <Button
                      type="button"
                      className="rounded-none bg-primary text-on-primary px-8 py-3 text-base hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
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
