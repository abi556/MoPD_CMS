"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { ChatPanel } from "@/components/chatbot/chat-panel";
import type { AppLocale } from "@/i18n/routing";
import {
  loadChatbotMessages,
  readStoredChatLocale,
  writeStoredChatLocale,
} from "@/lib/chat-locale";

export function ChatWidget() {
  const siteLocale = useLocale() as AppLocale;
  const tSite = useTranslations("chatbot");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [chatLocale, setChatLocale] = useState<AppLocale>(siteLocale);
  const [chatMessages, setChatMessages] = useState<AbstractIntlMessages | null>(
    null,
  );

  useEffect(() => {
    // Portal target exists only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR guard
    setMounted(true);
    const stored = readStoredChatLocale();
    setChatLocale(stored ?? siteLocale);
  }, [siteLocale]);

  useEffect(() => {
    if (!mounted) return;
    void loadChatbotMessages(chatLocale).then(setChatMessages);
  }, [chatLocale, mounted]);

  const handleChatLocaleChange = useCallback((next: AppLocale) => {
    writeStoredChatLocale(next);
    setChatLocale(next);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!mounted) return null;

  const launcher = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded={open}
      aria-controls="mopd-chat-panel"
      aria-label={tSite("openLabel")}
      className={`fixed z-45 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-primary/25 bg-linear-to-br from-primary to-primary-container text-on-primary shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 max-md:bottom-[max(1rem,env(safe-area-inset-bottom))] max-md:right-4 md:bottom-6 md:right-6 ${
        open ? "pointer-events-none scale-0 opacity-0" : "opacity-100"
      }`}
    >
      <span
        className="chat-launcher-ping absolute inset-0 animate-ping rounded-full bg-primary/20"
        aria-hidden
      />
      <MessageCircle className="relative h-7 w-7" strokeWidth={1.75} aria-hidden />
    </button>
  );

  const panel =
    open && chatMessages ? (
      <ChatPanel
        chatLocale={chatLocale}
        messages={chatMessages}
        onChatLocaleChange={handleChatLocaleChange}
        onClose={() => setOpen(false)}
      />
    ) : null;

  return createPortal(
    <>
      {launcher}
      {panel}
    </>,
    document.body,
  );
}
