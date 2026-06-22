"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { Send, Sparkles, X } from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { appTimeZone } from "@/i18n/config";
import type { AbstractIntlMessages } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ChatLocaleToggle } from "@/components/chatbot/chat-locale-toggle";
import { loadChatbotMessages } from "@/lib/chat-locale";
import {
  sendChatbotMessage,
  type ChatConfidence,
  type ChatSource,
} from "@/lib/public/chatbot-api";
import { getOrCreateChatSessionId } from "@/lib/public/chat-session";
import { ApiError } from "@/lib/api-client";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  confidence?: ChatConfidence;
  sources?: ChatSource[];
  disclaimer?: string;
}

interface QuickReply {
  id: string;
  labelKey: string;
  href?: string;
  promptKey?: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { id: "submit", labelKey: "quickSubmit", href: "/complaints/new" },
  { id: "track", labelKey: "quickTrack", href: "/complaints/track" },
  { id: "recover", labelKey: "quickRecover", href: "/complaints/recover" },
  { id: "faq", labelKey: "quickFaq", href: "/faq" },
  { id: "hours", labelKey: "quickHours", promptKey: "promptHours" },
];

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ChatPanelInnerProps {
  chatLocale: AppLocale;
  initialWelcome: string;
  onChatLocaleChange: (locale: AppLocale) => void;
  onClose: () => void;
}

function ChatPanelInner({
  chatLocale,
  initialWelcome,
  onChatLocaleChange,
  onClose,
}: ChatPanelInnerProps) {
  const t = useTranslations("chatbot");
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: newId(), role: "bot", text: initialWelcome },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(() => getOrCreateChatSessionId());

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const pushBotReply = useCallback(
    (payload: {
      text: string;
      confidence?: ChatConfidence;
      sources?: ChatSource[];
      disclaimer?: string;
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "bot",
          text: payload.text,
          confidence: payload.confidence,
          sources: payload.sources,
          disclaimer: payload.disclaimer,
        },
      ]);
      setTyping(false);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const handleChatLocaleChange = useCallback(
    (next: AppLocale) => {
      if (next === chatLocale) return;
      void loadChatbotMessages(next).then((loaded) => {
        const bundle = loaded.chatbot as Record<string, string>;
        setMessages((prev) => {
          if (prev.length <= 1 && prev[0]?.role === "bot") {
            return [{ id: newId(), role: "bot", text: bundle.welcome }];
          }
          return [
            ...prev,
            { id: newId(), role: "bot", text: bundle.languageSwitched },
          ];
        });
        onChatLocaleChange(next);
      });
    },
    [chatLocale, onChatLocaleChange],
  );

  useEffect(() => {
    scrollToBottom();
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [messages, typing, scrollToBottom]);

  const handleUserText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      setMessages((prev) => [...prev, { id: newId(), role: "user", text: trimmed }]);
      setInput("");
      scrollToBottom();
      setTyping(true);

      try {
        const data = await sendChatbotMessage({
          sessionId,
          message: trimmed,
          locale: chatLocale,
        });
        pushBotReply({
          text: data.reply,
          confidence: data.confidence,
          sources: data.sources,
          disclaimer: data.disclaimer,
        });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : t("errorGeneric");
        pushBotReply({ text: message, confidence: "guidance_only" });
      }
    },
    [chatLocale, pushBotReply, scrollToBottom, sessionId, t, typing],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleUserText(input);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleUserText(input);
    }
  };

  const onQuickPrompt = (promptKey: string) => {
    void handleUserText(t(promptKey as "promptHours"));
  };

  return (
    <div
      id="mopd-chat-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      lang={chatLocale}
      className={`fixed z-110 flex flex-col overflow-hidden border border-primary/15 bg-surface shadow-2xl animate-chat-panel-in max-md:inset-0 max-md:rounded-none md:bottom-24 md:right-6 md:h-[min(560px,calc(100vh-7rem))] md:w-[min(400px,calc(100vw-2rem))] md:rounded-none ${
        chatLocale === "am" ? "font-ethiopic" : ""
      }`}
    >
      <header className="relative shrink-0 overflow-hidden bg-linear-to-br from-primary via-primary-container to-brand-deep px-4 py-4 text-on-primary">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-on-primary/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/3 h-20 w-20 rounded-full bg-on-primary/5"
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-on-primary/30 bg-surface shadow-sm">
            <Image
              src="/mopd_fav.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <h2 id={titleId} className="truncate font-h3 text-h3 font-bold tracking-tight">
                  {t("name")}
                </h2>
                <Sparkles className="h-4 w-4 shrink-0 text-primary-fixed" aria-hidden />
              </div>
              <ChatLocaleToggle
                locale={chatLocale}
                onChange={handleChatLocaleChange}
                className="border-on-primary/30 bg-on-primary/10"
                activeClassName="bg-on-primary text-primary-container"
                inactiveClassName="text-on-primary/90 hover:bg-on-primary/15"
              />
            </div>
            <p className="mt-0.5 text-body-sm text-on-primary/90">{t("tagline")}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-on-primary/70">
              {t("statusOnline")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeLabel")}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-on-primary/25 bg-on-primary/10 text-on-primary transition-colors hover:bg-on-primary/20"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-brand-wash/50 px-4 py-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[85%] space-y-2">
              {msg.role === "bot" && msg.confidence === "guidance_only" ? (
                <p
                  className="rounded-none border border-amber-300/60 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-900"
                  role="note"
                >
                  {t("confidenceGuidance")}
                </p>
              ) : null}
              {msg.role === "bot" && msg.confidence === "verified" ? (
                <p className="text-[11px] font-medium text-emerald-700">
                  {t("confidenceVerified")}
                </p>
              ) : null}
              {msg.role === "bot" && msg.confidence === "refused" ? (
                <p className="text-[11px] text-text-secondary">{t("confidenceRefused")}</p>
              ) : null}
              <div
                className={`rounded-none px-3.5 py-2.5 text-body-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-on-primary"
                    : "border border-border-standard bg-surface text-on-surface"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "bot" && msg.sources && msg.sources.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {msg.sources.map((source) => (
                    <span
                      key={`${source.slug}-${source.title}`}
                      className="rounded-full border border-emerald-300/50 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800"
                    >
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:underline"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <Link href="/faq" className="underline-offset-2 hover:underline">
                          {source.title}
                        </Link>
                      )}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {typing ? (
          <div className="flex justify-start" aria-live="polite" aria-label={t("typing")}>
            <div className="flex gap-1 rounded-none border border-border-standard bg-surface px-3.5 py-3 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border-standard bg-surface px-3 py-3">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_REPLIES.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className="shrink-0 cursor-pointer rounded-full border border-primary/25 bg-brand-wash px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary"
              >
                {t(item.labelKey as "quickSubmit")}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => onQuickPrompt(item.promptKey!)}
                className="shrink-0 cursor-pointer rounded-full border border-primary/25 bg-brand-wash px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary"
              >
                {t(item.labelKey as "quickSubmit")}
              </button>
            ),
          )}
        </div>

        <p className="mb-2 text-[11px] leading-snug text-text-secondary">{t("disclaimer")}</p>

        <form onSubmit={onSubmit} className="flex gap-2">
          <label htmlFor="mopd-chat-input" className="sr-only">
            {t("inputLabel")}
          </label>
          <input
            ref={inputRef}
            id="mopd-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("inputPlaceholder")}
            autoComplete="off"
            maxLength={500}
            suppressHydrationWarning
            className="min-h-11 flex-1 rounded-none border border-border-standard bg-surface-bright px-3 text-body text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            aria-label={t("sendLabel")}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-none bg-primary text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  chatLocale: AppLocale;
  messages: AbstractIntlMessages;
  onChatLocaleChange: (locale: AppLocale) => void;
  onClose: () => void;
}

export function ChatPanel({
  chatLocale,
  messages,
  onChatLocaleChange,
  onClose,
}: ChatPanelProps) {
  const initialWelcome = (messages.chatbot as { welcome: string }).welcome;

  return (
    <NextIntlClientProvider locale={chatLocale} messages={messages} timeZone={appTimeZone}>
      <ChatPanelInner
        chatLocale={chatLocale}
        initialWelcome={initialWelcome}
        onChatLocaleChange={onChatLocaleChange}
        onClose={onClose}
      />
    </NextIntlClientProvider>
  );
}
