import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && routing.locales.includes(segment as AppLocale)) {
    return segment as AppLocale;
  }
  return null;
}

/** Staff shell routes where locale can switch without an RSC refetch. */
export function isClientOnlyLocaleSwitchPath(pathname: string): boolean {
  const locale = getLocaleFromPathname(pathname);
  const rest = locale
    ? pathname.slice(`/${locale}`.length) || "/"
    : pathname;

  return /^\/(dashboard|auth)(\/|$)/.test(rest);
}

export function replaceLocaleInPathname(
  pathname: string,
  nextLocale: AppLocale,
): string {
  const segments = pathname.split("/");
  if (
    segments.length > 1 &&
    routing.locales.includes(segments[1] as AppLocale)
  ) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  return `/${nextLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
