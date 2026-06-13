"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  channelMax,
  fetchDashboardAnalytics,
  statusMixTotal,
  type DashboardAnalyticsSnapshot,
} from "@/lib/staff/dashboard-analytics";
import { staffRoutes, staffPathWithQuery } from "@/lib/staff/routes";

function StatusMixChart({
  data,
  labels,
}: {
  data: DashboardAnalyticsSnapshot["statusMix"];
  labels: Record<string, string>;
}) {
  const total = statusMixTotal(data);
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-staff-nav-hover">
        {data.map((segment) => (
          <div
            key={segment.id}
            className="h-full"
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
            }}
            title={`${labels[segment.id]}: ${segment.value}`}
          />
        ))}
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {data.map((segment) => (
          <li
            key={segment.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex items-center gap-2 text-staff-text-muted">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              {labels[segment.id]}
            </span>
            <span className="font-medium tabular-nums text-staff-text">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlaDonut({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (percent / 100) * circumference;

  return (
    <div className="flex justify-center py-1">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--staff-border)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--staff-chart-submitted)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums text-staff-text">
          {percent}%
        </p>
      </div>
    </div>
  );
}

function WeeklyBars({
  data,
  submittedLabel,
  closedLabel,
}: {
  data: DashboardAnalyticsSnapshot["weeklyVolume"];
  submittedLabel: string;
  closedLabel: string;
}) {
  const max = Math.max(
    ...data.flatMap((week) => [week.submitted, week.closed]),
    1,
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs text-staff-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--staff-chart-submitted-bar)]" />
          {submittedLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--staff-chart-closed-bar)]" />
          {closedLabel}
        </span>
      </div>
      <div className="flex h-40 items-end justify-between gap-2">
        {data.map((week) => (
          <div
            key={week.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex h-32 w-full items-end justify-center gap-1.5">
              <div
                className="w-4 max-w-[18px] flex-1 rounded-t bg-[var(--staff-chart-submitted-bar)]"
                style={{ height: `${(week.submitted / max) * 100}%` }}
                title={`${submittedLabel}: ${week.submitted}`}
              />
              <div
                className="w-4 max-w-[18px] flex-1 rounded-t bg-[var(--staff-chart-closed-bar)]"
                style={{ height: `${(week.closed / max) * 100}%` }}
                title={`${closedLabel}: ${week.closed}`}
              />
            </div>
            <span className="text-[10px] text-staff-text-muted">{week.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelBars({
  data,
  labels,
}: {
  data: DashboardAnalyticsSnapshot["channels"];
  labels: Record<string, string>;
}) {
  const max = channelMax(data);

  return (
    <ul className="space-y-3">
      {data.map((channel) => (
        <li key={channel.id}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-staff-text-muted">{labels[channel.id]}</span>
            <span className="font-medium tabular-nums text-staff-text">
              {channel.value}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-staff-nav-hover">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(channel.value / max) * 100}%`,
                backgroundColor: channel.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function AnalyticsCard({
  title,
  subtitle,
  href,
  linkLabel,
  children,
}: {
  title: string;
  subtitle: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-staff-border bg-staff-surface p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-staff-text">{title}</h3>
          <p className="mt-0.5 text-sm text-staff-text-muted">{subtitle}</p>
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="cursor-pointer text-sm font-medium text-staff-nav-active hover:underline"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function DashboardAnalyticsPanel() {
  const t = useTranslations("staff.dashboard");
  const [data, setData] = useState<DashboardAnalyticsSnapshot | null>(null);

  useEffect(() => {
    void fetchDashboardAnalytics().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl border border-staff-border bg-staff-surface"
          />
        ))}
      </div>
    );
  }

  const statusLabels = {
    submitted: t("analytics.status.submitted"),
    open: t("analytics.status.open"),
    inReview: t("analytics.status.inReview"),
    resolved: t("analytics.status.resolved"),
    closed: t("analytics.status.closed"),
  };

  const channelLabels = {
    web: t("analytics.channels.web"),
    email: t("analytics.channels.email"),
    sms: t("analytics.channels.sms"),
    walkIn: t("analytics.channels.walkIn"),
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-staff-text-muted">{t("analytics.sampleNote")}</p>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title={t("analytics.statusTitle")}
          subtitle={t("analytics.statusSubtitle")}
          href={staffRoutes.reports.resolution}
          linkLabel={t("analytics.viewReport")}
        >
          <StatusMixChart data={data.statusMix} labels={statusLabels} />
          <div className="mt-3">
            <Link
              href={staffPathWithQuery(staffRoutes.complaints, { status: "OPEN" })}
              className="cursor-pointer text-xs font-medium text-staff-nav-active hover:underline"
            >
              {t("analytics.drillOpen")}
            </Link>
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title={t("analytics.slaTitle")}
          subtitle={t("analytics.slaSubtitle")}
          href={staffRoutes.reports.sla}
          linkLabel={t("analytics.viewReport")}
        >
          <SlaDonut percent={data.slaOnTimePercent} />
        </AnalyticsCard>

        <AnalyticsCard
          title={t("analytics.volumeTitle")}
          subtitle={t("analytics.volumeSubtitle")}
          href={staffRoutes.reports.volume}
          linkLabel={t("analytics.viewReport")}
        >
          <WeeklyBars
            data={data.weeklyVolume}
            submittedLabel={t("analytics.submitted")}
            closedLabel={t("analytics.closed")}
          />
        </AnalyticsCard>

        <AnalyticsCard
          title={t("analytics.channelsTitle")}
          subtitle={t("analytics.channelsSubtitle")}
          href={staffRoutes.reports.channels}
          linkLabel={t("analytics.viewReport")}
        >
          <ChannelBars data={data.channels} labels={channelLabels} />
        </AnalyticsCard>
      </div>
    </div>
  );
}
