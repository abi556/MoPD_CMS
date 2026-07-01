import { apiPost } from "@/lib/api-client";
import {
  COOKIE_POLICY_VERSION,
  type CookieConsentAction,
  type CookieConsentCategories,
} from "@/lib/public/cookie-consent";

export async function logCookieConsentToServer(
  action: CookieConsentAction,
  categories: CookieConsentCategories,
  locale?: string,
): Promise<void> {
  try {
    await apiPost(
      "/consent/cookie",
      {
        action,
        policyVersion: COOKIE_POLICY_VERSION,
        categories,
        locale,
      },
      { auth: false },
    );
  } catch {
    /* Non-blocking: local consent still applies if audit endpoint fails */
  }
}
