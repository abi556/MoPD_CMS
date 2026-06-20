export const STAFF_GUIDE_SLUGS = [
  "getting-started",
  "complaints-workflow",
  "sla",
  "recovery-inquiries",
  "reports-analytics",
  "notifications",
  "administration",
] as const;

export type StaffGuideSlug = (typeof STAFF_GUIDE_SLUGS)[number];

export function isStaffGuideSlug(value: string): value is StaffGuideSlug {
  return (STAFF_GUIDE_SLUGS as readonly string[]).includes(value);
}

/** Maps URL slug to helpGuides message namespace key (camelCase). */
export function staffGuideMessageKey(slug: StaffGuideSlug): string {
  return slug.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function staffGuidePath(slug: StaffGuideSlug): string {
  return `/dashboard/help/guides/${slug}`;
}
