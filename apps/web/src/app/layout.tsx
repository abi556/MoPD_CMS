import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notoEthiopic, sourceSans } from "@/styles/fonts";
import { RootProviders } from "@/components/providers/root-providers";
import { ServiceWorkerRegistrar } from "@/components/providers/service-worker-registrar";
import { getSiteUrl, siteConfig } from "@/lib/site-config";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.shortName} — ${siteConfig.name}`,
    template: `%s — ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  manifest: "/manifest.webmanifest",
  keywords: [
    "MoPD",
    "Ministry of Planning and Development",
    "Ethiopia",
    "complaint management",
    "grievance",
    "citizen feedback",
    "public service",
    "track complaint",
    "ቅሬታ",
    "የፕላንና ልማት ሚኒስቴር",
  ],
  authors: [{ name: "Ministry of Planning and Development" }],
  creator: "Ministry of Planning and Development",
  publisher: "Ministry of Planning and Development",
  category: "government",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      am: "/am",
    },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.shortName,
    title: `${siteConfig.shortName} — ${siteConfig.name}`,
    description: siteConfig.description,
    url: siteUrl,
    locale: "en",
    alternateLocale: ["am"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    title: `${siteConfig.shortName} — ${siteConfig.name}`,
    description: siteConfig.description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/mopd_fav.png", type: "image/png" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${notoEthiopic.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <RootProviders>{children}</RootProviders>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
