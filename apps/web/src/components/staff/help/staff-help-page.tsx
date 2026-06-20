"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Clock,
  Inbox,
  Keyboard,
  LifeBuoy,
  Mail,
  MailQuestion,
  Phone,
  Settings,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StaffPageShell } from "@/components/staff/ui/staff-page-shell";
import { useStaffKeyboardShortcuts } from "@/components/staff/help/staff-keyboard-shortcuts-provider";
import {
  getStaffSupportConfig,
  type StaffSupportContact,
} from "@/lib/staff/help/support-config";
import {
  STAFF_GUIDE_SLUGS,
  staffGuideMessageKey,
  staffGuidePath,
  type StaffGuideSlug,
} from "@/lib/staff/help/guide-catalog";
import {
  getShortcutDisplayKeys,
  STAFF_SHORTCUTS,
  type StaffShortcutId,
} from "@/lib/staff/help/staff-shortcuts";

const GUIDE_ICONS: Record<StaffGuideSlug, LucideIcon> = {
  "getting-started": User,
  "complaints-workflow": Inbox,
  sla: Clock,
  "recovery-inquiries": MailQuestion,
  "reports-analytics": BarChart3,
  notifications: Bell,
  administration: Settings,
};

const GUIDE_CARD_KEYS: Record<StaffGuideSlug, string> = {
  "getting-started": "gettingStarted",
  "complaints-workflow": "complaints",
  sla: "sla",
  "recovery-inquiries": "recovery",
  "reports-analytics": "reports",
  notifications: "notifications",
  administration: "admin",
};

function HelpSectionNav() {
  const t = useTranslations("help");

  const links = [
    { href: "#docs", label: t("nav.docs") },
    { href: "#shortcuts", label: t("nav.shortcuts") },
    { href: "#support", label: t("nav.support") },
  ] as const;

  return (
    <nav
      aria-label={t("title")}
      className="flex flex-wrap gap-2 rounded-xl border border-staff-border bg-staff-surface p-1.5 shadow-staff-card"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-lg px-3 py-2 text-sm font-medium text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/40"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function HelpSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-staff-border bg-staff-surface p-5 shadow-staff-card md:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-staff-nav-active-bg/15 text-staff-nav-active">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-staff-text">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function GuideTopicCard({
  slug,
  icon: Icon,
  title,
  description,
  readLabel,
}: {
  slug: StaffGuideSlug;
  icon: LucideIcon;
  title: string;
  description: string;
  readLabel: string;
}) {
  return (
    <Link href={staffGuidePath(slug)} className="group block h-full">
      <article className="flex h-full flex-col rounded-xl border border-staff-border bg-staff-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-staff-nav-active-bg/15 text-staff-nav-active transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="mt-4 font-semibold text-staff-text group-hover:text-staff-nav-active">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-staff-text-muted">
          {description}
        </p>
        <span className="mt-4 text-xs font-medium text-staff-nav-active group-hover:underline">
          {readLabel} →
        </span>
      </article>
    </Link>
  );
}

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-staff-border bg-staff-shell px-2 py-1 font-mono text-xs font-medium text-staff-text shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutRow({
  id,
  label,
  keys,
  enabled,
  onRun,
  tryLabel,
  unavailableLabel,
}: {
  id: StaffShortcutId;
  label: string;
  keys: string[];
  enabled: boolean;
  onRun: (id: StaffShortcutId) => void;
  tryLabel: string;
  unavailableLabel: string;
}) {
  return (
    <tr className="border-t border-staff-border">
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={!enabled}
          onClick={() => onRun(id)}
          className="group flex w-full flex-col items-start gap-1 rounded-lg px-2 py-1.5 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-staff-nav-hover/70 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <span className="font-medium text-staff-text">{label}</span>
          <span className="text-xs text-staff-text-muted">
            {enabled ? tryLabel : unavailableLabel}
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {keys.map((key) => (
            <ShortcutKey key={`${id}-${key}`}>{key}</ShortcutKey>
          ))}
        </span>
      </td>
    </tr>
  );
}

function SupportContactCard({
  title,
  when,
  contact,
  phoneLabel,
  emailLabel,
}: {
  title: string;
  when: string;
  contact: StaffSupportContact;
  phoneLabel: string;
  emailLabel: string;
}) {
  return (
    <article className="rounded-lg border border-staff-border bg-staff-shell/60 p-4">
      <h3 className="font-semibold text-staff-text">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-staff-text-muted">{when}</p>
      <dl className="mt-4 space-y-3 text-sm">
        {contact.phone ? (
          <div className="flex items-start gap-3">
            <dt className="flex items-center gap-1.5 font-medium text-staff-text-muted">
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              {phoneLabel}
            </dt>
            <dd>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="font-medium text-staff-nav-active hover:underline"
              >
                {contact.phone}
              </a>
            </dd>
          </div>
        ) : null}
        {contact.email ? (
          <div className="flex items-start gap-3">
            <dt className="flex items-center gap-1.5 font-medium text-staff-text-muted">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {emailLabel}
            </dt>
            <dd>
              <a
                href={`mailto:${contact.email}`}
                className="font-medium text-staff-nav-active hover:underline"
              >
                {contact.email}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export function StaffHelpPage() {
  const t = useTranslations("help");
  const tGuides = useTranslations("helpGuides");
  const { runShortcut, canRunShortcut } = useStaffKeyboardShortcuts();
  const support = getStaffSupportConfig();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const groups = ["general", "navigation"] as const;

  return (
    <StaffPageShell title={t("title")} subtitle={t("subtitle")}>
      <HelpSectionNav />

      <div className="mt-6 space-y-6">
        <HelpSection id="docs" icon={BookOpen} title={t("docs.title")}>
          <p className="mb-5 text-sm leading-relaxed text-staff-text-muted">
            {t("docs.intro")}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {STAFF_GUIDE_SLUGS.map((slug) => {
              const messageKey = staffGuideMessageKey(slug);
              const cardKey = GUIDE_CARD_KEYS[slug];
              return (
                <GuideTopicCard
                  key={slug}
                  slug={slug}
                  icon={GUIDE_ICONS[slug]}
                  title={tGuides(`${messageKey}.title`)}
                  description={t(`docs.${cardKey}.cardHint`)}
                  readLabel={t("docs.readGuide")}
                />
              );
            })}
          </div>
        </HelpSection>

        <HelpSection id="shortcuts" icon={Keyboard} title={t("shortcuts.title")}>
          <p className="mb-5 text-sm leading-relaxed text-staff-text-muted">
            {t("shortcuts.intro")}
          </p>
          <div className="space-y-6">
            {groups.map((group) => {
              const rows = STAFF_SHORTCUTS.filter((item) => item.group === group);
              if (rows.length === 0) {
                return null;
              }

              return (
                <div key={group}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-staff-text-muted">
                    {t(`shortcuts.groups.${group}`)}
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-staff-border">
                    <table className="w-full min-w-[20rem] text-left text-sm">
                      <thead className="bg-staff-shell/80 text-staff-text-muted">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">
                            {t("shortcuts.columnAction")}
                          </th>
                          <th className="px-4 py-2.5 font-medium">
                            {t("shortcuts.columnKeys")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <ShortcutRow
                            key={row.id}
                            id={row.id}
                            label={t(`shortcuts.${row.labelKey}`)}
                            keys={getShortcutDisplayKeys(row.id, userAgent)}
                            enabled={canRunShortcut(row.id)}
                            onRun={runShortcut}
                            tryLabel={t("shortcuts.tryNow")}
                            unavailableLabel={t("shortcuts.unavailable")}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </HelpSection>

        <HelpSection id="support" icon={LifeBuoy} title={t("support.title")}>
          <p className="mb-2 text-sm leading-relaxed text-staff-text-muted">
            {t("support.intro")}
          </p>
          <p className="mb-5 text-sm text-staff-text-muted">
            <span className="font-medium text-staff-text">{t("support.hours")}:</span>{" "}
            {t("support.hoursDefault")}
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            <SupportContactCard
              title={t("support.ict.title")}
              when={t("support.ict.when")}
              contact={support.ict}
              phoneLabel={t("support.phone")}
              emailLabel={t("support.email")}
            />
            <SupportContactCard
              title={t("support.cms.title")}
              when={t("support.cms.when")}
              contact={support.cms}
              phoneLabel={t("support.phone")}
              emailLabel={t("support.email")}
            />
            <SupportContactCard
              title={t("support.program.title")}
              when={t("support.program.when")}
              contact={support.program}
              phoneLabel={t("support.phone")}
              emailLabel={t("support.email")}
            />
          </div>
          <p className="mt-4 text-xs text-staff-text-muted">
            {t("support.publicContactNote")}{" "}
            <Link
              href="/contact"
              className="font-medium text-staff-nav-active hover:underline"
            >
              {t("support.publicContactLink")}
            </Link>
            .
          </p>
        </HelpSection>
      </div>
    </StaffPageShell>
  );
}
