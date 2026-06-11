import type { AbstractIntlMessages } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

const STORAGE_KEY = "mopd_chat_locale";

export async function loadChatbotMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  const bundle =
    locale === "am"
      ? (await import("../../messages/am.json")).default
      : (await import("../../messages/en.json")).default;

  return { chatbot: bundle.chatbot };
}

export function readStoredChatLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(STORAGE_KEY);
  return value === "en" || value === "am" ? value : null;
}

export function writeStoredChatLocale(locale: AppLocale): void {
  sessionStorage.setItem(STORAGE_KEY, locale);
}
