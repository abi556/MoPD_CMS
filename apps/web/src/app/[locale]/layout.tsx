import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ClientIntlProvider } from "@/components/providers/client-intl-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { routing, type AppLocale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
  icons: {
    icon: "/mopd_fav.png",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <ClientIntlProvider
      initialLocale={locale as AppLocale}
      initialMessages={messages}
    >
      <AuthProvider>
        <ToastProvider>
          <SkipToContent />
          <div
            id="main-content"
            lang={locale}
            className={`flex flex-1 flex-col ${locale === "am" ? "font-ethiopic" : ""}`}
          >
            {children}
          </div>
        </ToastProvider>
      </AuthProvider>
    </ClientIntlProvider>
  );
}
