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
import type { AppLocale } from "@/i18n/routing";

const LOCALE_COOKIE = "NEXT_LOCALE";

type ClientIntlContextValue = {
  switchLocale: (locale: AppLocale) => Promise<void>;
};

const ClientIntlContext = createContext<ClientIntlContextValue | null>(null);

async function loadMessages(locale: AppLocale): Promise<AbstractIntlMessages> {
  switch (locale) {
    case "am":
      return (await import("../../../messages/am.json")).default;
    case "en":
    default:
      return (await import("../../../messages/en.json")).default;
  }
}

function applyDocumentLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  const main = document.getElementById("main-content");
  if (main) {
    main.lang = locale;
    main.classList.toggle("font-ethiopic", locale === "am");
  }
}

function replaceUrlLocale(nextLocale: AppLocale) {
  const { pathname, search, hash } = window.location;
  const segments = pathname.split("/");
  if (segments.length > 1 && (segments[1] === "en" || segments[1] === "am")) {
    segments[1] = nextLocale;
  } else {
    segments.splice(1, 0, nextLocale);
  }
  const nextPath = segments.join("/") || `/${nextLocale}`;
  window.history.replaceState(window.history.state, "", `${nextPath}${search}${hash}`);
  document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=31536000;samesite=lax`;
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

  // Reload message bundles so JSON edits (and client locale switches) stay in sync.
  useEffect(() => {
    let cancelled = false;
    void loadMessages(initialLocale).then((nextMessages) => {
      if (!cancelled) {
        setLocale(initialLocale);
        setMessages(nextMessages);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialLocale]);

  const switchLocale = useCallback(
    async (nextLocale: AppLocale) => {
      if (nextLocale === locale) {
        return;
      }

      const nextMessages = await loadMessages(nextLocale);
      setLocale(nextLocale);
      setMessages(nextMessages);
      replaceUrlLocale(nextLocale);
      applyDocumentLocale(nextLocale);
    },
    [locale],
  );

  return (
    <ClientIntlContext.Provider value={{ switchLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
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
