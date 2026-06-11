"use client";

import type { AppLocale } from "@/i18n/routing";

interface ChatLocaleToggleProps {
  locale: AppLocale;
  onChange: (locale: AppLocale) => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function ChatLocaleToggle({
  locale,
  onChange,
  className = "",
  activeClassName = "bg-primary text-on-primary",
  inactiveClassName = "text-text-secondary hover:text-primary",
}: ChatLocaleToggleProps) {
  const base =
    "rounded-none px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 active:scale-95 cursor-pointer sm:text-[11px]";

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 rounded-none border p-0.5 ${className}`}
      role="group"
      aria-label="Chat language"
    >
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`${base} ${locale === "en" ? activeClassName : inactiveClassName}`}
        aria-pressed={locale === "en"}
        aria-label="Chat in English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("am")}
        className={`${base} ${locale === "am" ? activeClassName : inactiveClassName}`}
        aria-pressed={locale === "am"}
        aria-label="Chat in Amharic"
      >
        አማ
      </button>
    </div>
  );
}
