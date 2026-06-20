/**
 * Canonical site metadata shared by manifest, robots, sitemap, and SEO tags.
 * The public origin is configurable via NEXT_PUBLIC_SITE_URL so non-production
 * environments (staging/preview) advertise the correct absolute URLs.
 */
const FALLBACK_SITE_URL = "https://cms.mopd.gov.et";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = raw && raw.length > 0 ? raw : FALLBACK_SITE_URL;
  return url.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "MoPD Complaint Management System",
  shortName: "MoPD CMS",
  description:
    "Submit and track complaints to the Ministry of Planning and Development (MoPD) of Ethiopia. A secure, bilingual (Amharic/English) citizen-centered portal for transparent and accountable public service.",
  // Keep in sync with the staff console brand primary (#3A6B35).
  themeColor: "#3A6B35",
  backgroundColor: "#fcf9f8",
  locales: ["en", "am"] as const,
  defaultLocale: "en" as const,
  twitterHandle: "@MoPDEthiopia",
} as const;
