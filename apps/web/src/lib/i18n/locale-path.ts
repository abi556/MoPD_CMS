import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && routing.locales.includes(segment as AppLocale)) {
    return segment as AppLocale;
  }
  return null;
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
