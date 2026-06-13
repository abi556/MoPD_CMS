"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  NextIntlClientProvider,
  type AbstractIntlMessages,
} from "next-intl";
import { usePathname } from "next/navigation";
import { appTimeZone } from "@/i18n/config";
import type { AppLocale } from "@/i18n/routing";
import {
  getLocaleFromPathname,
  replaceLocaleInPathname,
} from "@/lib/i18n/locale-path";
import { loadMessages } from "@/lib/i18n/load-messages";

const LOCALE_COOKIE = "NEXT_LOCALE";

type ClientIntlContextValue = {
  switchLocale: (locale: AppLocale) => Promise<void>;
};

const ClientIntlContext = createContext<ClientIntlContextValue | null>(null);

function applyDocumentLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  const main = document.getElementById("main-content");
  if (main) {
    main.lang = locale;
    main.classList.toggle("font-ethiopic", locale === "am");
  }
}

interface ClientIntlProviderProps {
  initialLocale: AppLocale;
  initialMessages: AbstractIntlMessages;
  children: ReactNode;
}

export function ClientIntlProvider({
  initialLocale,
  initialMessages,
  children,
}: ClientIntlProviderProps) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(initialMessages);
  const pathname = usePathname();

  // Keep bundles in sync when the server layout passes updated messages (deploy, new strings).
  // Skip while the URL locale was switched client-side without a full navigation.
  useEffect(() => {
    if (initialLocale !== locale) {
      return;
    }
    setMessages(initialMessages);
  }, [initialLocale, initialMessages, locale]);

  // Follow server locale on real navigations (links, back/forward). Skip when the
  // URL was updated client-side via replaceState during switchLocale.
  useEffect(() => {
    if (initialLocale === locale) {
      return;
    }

    const urlLocale = getLocaleFromPathname(window.location.pathname);
    if (urlLocale && urlLocale !== initialLocale) {
      return;
    }

    let cancelled = false;
    void loadMessages(initialLocale).then((nextMessages) => {
      if (!cancelled) {
        setLocale(initialLocale);
        setMessages(nextMessages);
        applyDocumentLocale(initialLocale);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialLocale, locale]);

  const switchLocale = useCallback(
    async (nextLocale: AppLocale) => {
      if (nextLocale === locale) {
        return;
      }

      const nextMessages = await loadMessages(nextLocale);
      setLocale(nextLocale);
      setMessages(nextMessages);

      document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=31536000;samesite=lax`;
      applyDocumentLocale(nextLocale);

      const nextPath = replaceLocaleInPathname(pathname, nextLocale);
      const search = window.location.search;
      const url = search ? `${nextPath}${search}` : nextPath;

      // Client-only URL update — avoids RSC refetch, auth remount, and skeleton flash.
      window.history.replaceState(window.history.state, "", url);
    },
    [locale, pathname],
  );

  return (
    <ClientIntlContext.Provider value={{ switchLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={appTimeZone}>
        {children}
      </NextIntlClientProvider>
    </ClientIntlContext.Provider>
  );
}

export function useClientIntlSwitch(): ClientIntlContextValue["switchLocale"] {
  const context = useContext(ClientIntlContext);
  if (!context) {
    throw new Error("useClientIntlSwitch must be used within ClientIntlProvider");
  }
  return context.switchLocale;
}
