"use client";

import { ArrowLeft, CheckCircle2, CircleAlert, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";
import {
  staffGuideMessageKey,
  type StaffGuideSlug,
} from "@/lib/staff/help/guide-catalog";
import { staffRoutes } from "@/lib/staff/routes";

type GuideListKey = "dos" | "donts";
type GuideRecordKey = "scenarios" | "steps";

function GuideListSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "do" | "dont";
}) {
  if (items.length === 0) {
    return null;
  }

  const Icon = variant === "do" ? CheckCircle2 : CircleAlert;
  const iconClass =
    variant === "do" ? "text-emerald-600" : "text-amber-700 dark:text-amber-500";

  return (
    <section className="rounded-xl border border-staff-border bg-staff-shell/40 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-staff-text">
        <Icon className={`h-5 w-5 ${iconClass}`} aria-hidden />
        {title}
      </h2>
      <ul className="space-y-2.5 text-sm leading-relaxed text-staff-text">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                variant === "do" ? "bg-emerald-600" : "bg-amber-600"
              }`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GuideRecordSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; body: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-staff-border bg-staff-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-staff-text">
        <ListOrdered className="h-5 w-5 text-staff-nav-active" aria-hidden />
        {title}
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-staff-border/80 bg-staff-shell/50 p-4"
          >
            <h3 className="font-medium text-staff-text">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-staff-text-muted">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StaffGuideView({ slug }: { slug: StaffGuideSlug }) {
  const t = useTranslations("helpGuides");
  const key = staffGuideMessageKey(slug);

  const title = t(`${key}.title`);
  const summary = t(`${key}.summary`);
  const dos = t.raw(`${key}.dos`) as string[];
  const donts = t.raw(`${key}.donts`) as string[];
  const scenarios = t.raw(`${key}.scenarios`) as Array<{
    title: string;
    body: string;
  }>;
  const steps = t.raw(`${key}.steps`) as Array<{ title: string; body: string }>;
  const openHref = t(`${key}.openInAppHref`);
  const openLabel = t(`${key}.openInAppLabel`);

  const readList = (listKey: GuideListKey): string[] => {
    const value = listKey === "dos" ? dos : donts;
    return Array.isArray(value) ? value : [];
  };

  const readRecords = (recordKey: GuideRecordKey) => {
    const value = recordKey === "scenarios" ? scenarios : steps;
    return Array.isArray(value) ? value : [];
  };

  return (
    <StaffPageShell
      title={title}
      subtitle={summary}
      action={
        <Link
          href={`${staffRoutes.help}#docs`}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-staff-nav-active transition-colors hover:bg-staff-nav-hover"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToHelp")}
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <GuideListSection
            title={t("dosTitle")}
            items={readList("dos")}
            variant="do"
          />
          <GuideListSection
            title={t("dontsTitle")}
            items={readList("donts")}
            variant="dont"
          />
        </div>

        <GuideRecordSection title={t("scenariosTitle")} items={readRecords("scenarios")} />

        <GuideRecordSection title={t("stepsTitle")} items={readRecords("steps")} />

        {openHref ? (
          <div className="rounded-xl border border-dashed border-staff-border bg-staff-shell/30 p-4">
            <p className="text-sm text-staff-text-muted">{t("openInApp")}</p>
            <Link
              href={openHref}
              className="mt-2 inline-flex text-sm font-medium text-staff-nav-active hover:underline"
            >
              {openLabel} →
            </Link>
          </div>
        ) : null}
      </div>
    </StaffPageShell>
  );
}
