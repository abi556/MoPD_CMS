import type { AppLocale } from "@/i18n/routing";
import { loadChatbotMessages as loadChatbotBundle } from "@/lib/i18n/load-messages";

const STORAGE_KEY = "mopd_chat_locale";

export async function loadChatbotMessages(locale: AppLocale) {
  return loadChatbotBundle(locale);
}

export function readStoredChatLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(STORAGE_KEY);
  return value === "en" || value === "am" ? value : null;
}

export function writeStoredChatLocale(locale: AppLocale): void {
  sessionStorage.setItem(STORAGE_KEY, locale);
}
