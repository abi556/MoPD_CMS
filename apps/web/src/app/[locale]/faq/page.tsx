import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { HelpCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

const FAQ_IDS = [
  "types",
  "requiredInfo",
  "whyPersonalInfo",
  "anonymous",
  "category",
  "consent",
  "evidenceRequired",
  "evidence",
  "fileTypes",
  "track",
  "lostReference",
  "trackingVisibility",
  "timeline",
  "editAfterSubmit",
  "sharedWith",
  "multipleComplaints",
  "languages",
  "privacy",
  "appeal",
  "contact",
] as const;

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-max-width px-gutter py-12 md:py-20">
        <article className="mx-auto max-w-3xl space-y-10">
          <header className="space-y-4 border-b border-border-standard pb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
              <HelpCircle className="h-4 w-4" />
              <span className="text-label font-label uppercase">{t("eyebrow")}</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-2xl text-body text-text-secondary">
              {t("subtitle")}
            </p>
          </header>

          <div className="space-y-3">
            {FAQ_IDS.map((id) => (
              <details
                key={id}
                className="group rounded-xl border border-border-standard bg-surface-container-lowest open:shadow-sm"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-h3 text-h3 text-on-surface marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span>{t(`items.${id}.question`)}</span>
                    <span
                      className="mt-1 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <div className="border-t border-border-standard px-5 py-4 text-body-sm text-text-secondary leading-relaxed">
                  {t(`items.${id}.answer`)}
                </div>
              </details>
            ))}
          </div>

          <section className="rounded-2xl border border-primary/10 bg-brand-wash p-6 text-center">
            <h2 className="font-h3 text-h3 text-on-surface">{t("stillNeedHelp")}</h2>
            <p className="mt-2 text-body-sm text-text-secondary">{t("stillNeedHelpBody")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/complaints/new"
                className="rounded-lg bg-primary px-5 py-2.5 font-label text-label text-on-primary transition-opacity hover:opacity-90"
              >
                {t("ctaSubmit")}
              </Link>
              <Link
                href="/contact"
                className="rounded-lg border border-border-standard bg-surface-container-lowest px-5 py-2.5 font-label text-label text-primary transition-colors hover:bg-brand-surface"
              >
                {t("ctaContact")}
              </Link>
            </div>
          </section>
        </article>
      </div>
    </PublicShell>
  );
}
