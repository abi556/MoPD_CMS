"use client";

import type { ReactNode } from "react";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { PublicFooter } from "@/components/layout/public/public-footer";
import { PublicHeader } from "@/components/layout/public/public-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-surface font-body text-body text-on-surface antialiased">
      <PublicHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <PublicFooter />
      <ChatWidget />
    </div>
  );
}
