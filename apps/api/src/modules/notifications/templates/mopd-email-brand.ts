/** MoPD government email brand tokens — inline CSS safe for email clients. */

export const MOPD_EMAIL_COLORS = {
  fern: '#527f47',
  fernDark: '#3a6b35',
  fernLight: '#eef2ea',
  surface: '#ffffff',
  surfaceMuted: '#f4f7f2',
  text: '#1c1b1b',
  textMuted: '#475569',
  border: '#d8e0d4',
  link: '#3a6b35',
} as const;

export interface MoPdEmailBrandConfig {
  cmsUrl: string;
  ministryUrl: string;
  logoUrl: string;
  supportEmail: string;
  ministryNameEn: string;
  ministryNameAm: string;
  cmsNameEn: string;
  cmsNameAm: string;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getMoPdEmailBrandConfig(): MoPdEmailBrandConfig {
  const cmsUrl = trimTrailingSlash(
    process.env.APP_PUBLIC_URL ?? 'https://mopdcms.gov.et',
  );
  const ministryUrl = trimTrailingSlash(
    process.env.MOPD_MINISTRY_URL ?? 'https://mopd.gov.et',
  );

  return {
    cmsUrl,
    ministryUrl,
    logoUrl: `${cmsUrl}/mopd_logo.png`,
    supportEmail: process.env.MOPD_SUPPORT_EMAIL ?? 'support@mopd.gov.et',
    ministryNameEn: 'Ministry of Planning and Development',
    ministryNameAm: 'የእቅድና ልማት ሚኒስትሪ',
    cmsNameEn: 'MoPD Complaint Management System',
    cmsNameAm: 'የእቅድና ልማት ሚኒስትሪ ቅሬታ አስተዳደር ስርዓት',
  };
}

export function publicCmsPath(cmsUrl: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${cmsUrl}${normalized}`;
}
