import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

/**
 * Locale routing for the App Router (`[locale]` segment).
 * Matcher must include `/` and `/(en|am)/*` so `/en` works after dev restarts
 * (see apps/web/scripts/clean-next-dev.mjs for cache hygiene).
 */
export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(en|am)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
