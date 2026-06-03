import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { CircleCheck } from "lucide-react";
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
      <section className="relative bg-brand-wash pb-24 pt-16 md:pb-40 md:pt-28">
        <div className="mx-auto grid w-full max-w-max-width items-center gap-10 px-gutter md:grid-cols-12">
          <div className="space-y-7 md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1">
              <span className="text-label font-label uppercase text-primary">
                {t("officialPortal")}
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-on-background md:text-6xl md:leading-[1.15]">
              {t("heroHeading")}
            </h1>
            <p className="max-w-2xl text-body text-text-secondary">
              {t("heroBody")} {t("heroBodyExtended")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/complaints/new">
                <Button type="button" className="px-7 py-3">
                  {t("ctaSubmit")}
                </Button>
              </Link>
              <Link href="/complaints/track">
                <Button variant="secondary" type="button" className="px-7 py-3">
                  {t("ctaTrack")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative hidden md:col-span-5 md:block">
            <div className="relative aspect-square rounded-3xl border border-border-standard bg-surface-container-lowest shadow-lg">
              <Image
                src="/mopd_logo.png"
                alt="MoPD portal visual"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain object-[center_38%] p-8 pb-20 opacity-95"
                priority
              />
              <div className="absolute left-8 right-8 bottom-6 rounded-xl border border-border-standard bg-surface-container-lowest/95 p-3 shadow-md backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success/10">
                    <CircleCheck
                      className="h-[18px] w-[18px] text-success"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-label font-label text-text-secondary">
                      {t("complaintIdLabel")}
                    </p>
                    <p className="font-h3 text-h3 text-on-surface">
                      #MP-2026-0882
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-surface-container-high">
                  <div className="h-1.5 w-full rounded-full bg-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest py-20">
        <div className="mx-auto w-full max-w-max-width px-gutter">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-h1 text-h1 text-on-background">
              {t("processTitle")}
            </h2>
            <p className="mt-3 text-body text-text-secondary">
              {t("processSubtitle")}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              [
                "1",
                t("steps.submission.title"),
                t("steps.submission.body"),
              ],
              [
                "2",
                t("steps.review.title"),
                t("steps.review.body"),
              ],
              [
                "3",
                t("steps.investigation.title"),
                t("steps.investigation.body"),
              ],
              [
                "4",
                t("steps.resolution.title"),
                t("steps.resolution.body"),
              ],
            ].map(([step, title, body]) => (
              <article
                key={step}
                className="rounded-2xl border border-border-standard bg-surface p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary font-h3 text-h3">
                  {step}
                </div>
                <h3 className="mt-5 font-h3 text-h3 text-on-surface">{title}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-max-width px-gutter">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12">
            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-display text-on-primary">
                  {t("readyTitle")}
                </h2>
                <p className="mt-2 max-w-xl text-body text-on-primary/80">
                  {t("readyBody")}
                </p>
              </div>
              <Link href="/complaints/new">
                <Button
                  type="button"
                  className="bg-surface-container-lowest px-8 py-3 text-primary hover:bg-brand-wash"
                >
                  {t("startSubmission")}
                </Button>
              </Link>
            </div>
            <div className="pointer-events-none absolute -left-12 top-8 h-36 w-36 rounded-full bg-on-primary/10" />
            <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-on-primary/10" />
            <div className="pointer-events-none absolute right-16 bottom-[-56px] h-44 w-44 rounded-full bg-on-primary/10" />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
