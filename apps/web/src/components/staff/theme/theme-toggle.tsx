"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { useTranslations } from "next-intl";
import { StaffThemeContext } from "@/components/staff/theme/staff-theme-provider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("staff.theme");
  const ctx = useContext(StaffThemeContext);
  if (!ctx) return null;

  const { preference, cyclePreference } = ctx;

  const Icon =
    preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;
  const label =
    preference === "light"
      ? t("light")
      : preference === "dark"
        ? t("dark")
        : t("system");

  return (
    <button
      type="button"
      onClick={cyclePreference}
      className={
        compact
          ? "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text"
          : "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-staff-text-muted transition-colors hover:bg-staff-nav-hover hover:text-staff-text"
      }
      aria-label={t("toggle", { mode: label })}
      title={label}
    >
      <Icon size={compact ? 17 : 18} aria-hidden />
      {compact ? null : (
        <span className="hidden text-xs font-medium xl:inline">{label}</span>
      )}
    </button>
  );
}
