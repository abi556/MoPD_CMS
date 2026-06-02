import type { ReactNode } from "react";
import { notoEthiopic, sourceSans } from "@/styles/fonts";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${notoEthiopic.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
