"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "dashboard",
  complaints: "complaints",
  reports: "reports",
  "recovery-inquiries": "recoveryInquiries",
  volume: "reportsVolume",
  resolution: "reportsResolution",
  channels: "reportsChannels",
  exports: "reportsExports",
  admin: "admin",
  users: "adminUsers",
  roles: "adminRoles",
  categories: "adminCategories",
  "org-units": "adminOrgUnits",
  templates: "adminTemplates",
  audit: "adminAudit",
  system: "adminSystem",
  profile: "profile",
  notifications: "notifications",
};

function segmentLabelKey(segment: string, parentSegment?: string): string | undefined {
  if (segment === "sla") {
    return parentSegment === "admin" ? "adminSla" : "reportsSla";
  }
  if (segment === "notifications" && parentSegment === "admin") {
    return "adminNotifications";
  }
  return SEGMENT_LABELS[segment];
}

export function StaffBreadcrumbs() {
  const pathname = usePathname();
  const tNav = useTranslations("nav-staff");

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ href: string; label: string }> = [];
  let acc = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const parentSegment = i > 0 ? segments[i - 1] : undefined;
    acc += `/${segment}`;
    const key = segmentLabelKey(segment, parentSegment);
    const label = key ? tNav(key as "dashboard") : segment;
    crumbs.push({ href: acc, label });
  }

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-staff-text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {isLast ? (
                <span className="font-medium text-staff-text">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-staff-nav-active hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
