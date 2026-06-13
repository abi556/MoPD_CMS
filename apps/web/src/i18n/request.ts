import { getRequestConfig } from "next-intl/server";
import { loadMessages } from "@/lib/i18n/load-messages";
import { appTimeZone } from "./config";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "am")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: appTimeZone,
    messages: await loadMessages(locale as "en" | "am"),
  };
});
