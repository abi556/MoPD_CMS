import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { SkipToContent } from "@/components/shell/skip-to-content";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { routing, type AppLocale } from "@/i18n/routing";
import { notoEthiopic, sourceSans } from "@/styles/fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${sourceSans.variable} ${notoEthiopic.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className={`min-h-full flex flex-col bg-background text-foreground ${
          locale === "am" ? "font-ethiopic" : ""
        }`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ToastProvider>
              <SkipToContent />
              <div id="main-content" className="flex flex-1 flex-col">
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
